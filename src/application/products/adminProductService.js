import { prisma } from '../../../lib/prisma.js';

/**
 * Admin Product Service — Direct Sale Only.
 *
 * Provides server-side product management for admins. All functions assume
 * the caller has already been authenticated and authorized as admin (the API
 * route layer handles that).
 *
 * SUPPLIER CONSTRAINT:
 * Product.supplierId is NOT NULL in the schema. Since we are in Direct Sale
 * mode, there is no real supplier. We resolve the existing platform/dev
 * supplier record and assign it transparently. This avoids schema changes
 * and migrations.
 */

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * Resolve the platform supplier id. Cached per service module lifecycle.
 * Throws if no supplier exists (should never happen in a seeded DB).
 */
let _platformSupplierId = null;

async function getPlatformSupplierId() {
  if (_platformSupplierId) return _platformSupplierId;

  const supplier = await prisma.supplier.findFirst({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!supplier) {
    throw Object.assign(
      new Error(
        'No supplier record exists. Run prisma:seed to create the platform supplier.',
      ),
      { code: 'SUPPLIER_MISSING', status: 500 },
    );
  }

  _platformSupplierId = supplier.id;
  return _platformSupplierId;
}

/** Standard include for admin product queries. */
function adminProductInclude() {
  return {
    category: { select: { id: true, name: true, slug: true } },
    images: {
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        url: true,
        alt: true,
        sortOrder: true,
        createdAt: true,
      },
    },
  };
}

// ─── Create ────────────────────────────────────────────────────────────

/**
 * Create a new Direct Sale product.
 *
 * @param {object} data Validated product data (from createProductSchema).
 * @returns {Promise<object>} The created product with images and category.
 */
export async function createProduct(data) {
  const supplierId = await getPlatformSupplierId();

  // Verify category exists and is not soft-deleted.
  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, deletedAt: null },
  });
  if (!category) {
    throw Object.assign(new Error('Category not found.'), {
      code: 'VALIDATION_ERROR',
      status: 422,
    });
  }

  const images = (data.images || []).map((img, index) => ({
    url: img.url,
    alt: img.alt || null,
    sortOrder: img.sortOrder ?? index,
  }));

  const product = await prisma.product.create({
    data: {
      supplierId,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description || null,
      price: data.price,
      currency: 'NGN',
      stock: data.stock,
      purchaseMode: 'DIRECT_SALE',
      status: data.status || 'draft',
      images: images.length > 0 ? { create: images } : undefined,
    },
    include: adminProductInclude(),
  });

  return product;
}

// ─── List ──────────────────────────────────────────────────────────────

/**
 * List all products for admin (including drafts and soft-deleted).
 *
 * @param {object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @param {string} [params.search] Free-text search on title.
 * @param {string} [params.status] Filter by status.
 * @param {string} [params.categoryId] Filter by category.
 * @returns {Promise<{ products: object[], pagination: object }>}
 */
export async function listAdminProducts({
  page = 1,
  limit = 20,
  search,
  status,
  categoryId,
} = {}) {
  const where = { deletedAt: null };

  if (status) {
    where.status = status;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: adminProductInclude(),
    }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1 && total > 0,
    },
  };
}

// ─── Get by ID ─────────────────────────────────────────────────────────

/**
 * Get a single product by ID for admin (no visibility filter).
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getAdminProductById(id) {
  if (!id) return null;

  return prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: adminProductInclude(),
  });
}

// ─── Update ────────────────────────────────────────────────────────────

/**
 * Update a product. Accepts any combination of fields.
 *
 * If `images` is provided, the existing images are replaced (delete all,
 * then create new). This is a simple strategy that avoids complex diffing.
 *
 * @param {string} id
 * @param {object} data Validated update data (from updateProductSchema).
 * @returns {Promise<object>} Updated product.
 */
export async function updateProduct(id, data) {
  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw Object.assign(new Error('Product not found.'), {
      code: 'NOT_FOUND',
      status: 404,
    });
  }

  // If categoryId is changing, verify the new category exists.
  if (data.categoryId && data.categoryId !== existing.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, deletedAt: null },
    });
    if (!category) {
      throw Object.assign(new Error('Category not found.'), {
        code: 'VALIDATION_ERROR',
        status: 422,
      });
    }
  }

  // Build the update payload — only include fields that were provided.
  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined)
    updateData.description = data.description || null;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.status !== undefined) updateData.status = data.status;

  // If images are explicitly provided, replace all existing images.
  if (data.images !== undefined) {
    await prisma.productImage.deleteMany({ where: { productId: id } });

    if (data.images.length > 0) {
      updateData.images = {
        create: data.images.map((img, index) => ({
          url: img.url,
          alt: img.alt || null,
          sortOrder: img.sortOrder ?? index,
        })),
      };
    }
  }

  return prisma.product.update({
    where: { id },
    data: updateData,
    include: adminProductInclude(),
  });
}

// ─── Status toggle ─────────────────────────────────────────────────────

/**
 * Set product status (publish / unpublish).
 *
 * @param {string} id
 * @param {'active'|'draft'} status
 * @returns {Promise<object>}
 */
export async function setProductStatus(id, status) {
  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw Object.assign(new Error('Product not found.'), {
      code: 'NOT_FOUND',
      status: 404,
    });
  }

  return prisma.product.update({
    where: { id },
    data: { status },
    include: adminProductInclude(),
  });
}

// ─── Archive (soft delete) ─────────────────────────────────────────────

/**
 * Archive a product (soft delete). Sets deletedAt and moves to draft.
 * Historical OrderItems remain valid because the Product row is not deleted.
 *
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function archiveProduct(id) {
  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw Object.assign(new Error('Product not found.'), {
      code: 'NOT_FOUND',
      status: 404,
    });
  }

  return prisma.product.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: 'draft',
    },
    include: adminProductInclude(),
  });
}

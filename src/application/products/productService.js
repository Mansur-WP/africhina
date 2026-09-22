import { prisma } from '../../../lib/prisma.js';
import {
  resolveProductSort,
  PRODUCT_PAGE_SIZE_DEFAULT,
} from '../../shared/validators/product.js';

/**
 * Product catalogue application service.
 *
 * All catalogue reads for customers/guests go through here. Two invariants are
 * enforced in every query and MUST be preserved:
 *
 *  1. Visibility — only `status: 'active'` products that are NOT soft-deleted
 *     (`deletedAt: null`) are ever returned to the public catalogue. Draft /
 *     inactive / deleted products stay hidden.
 *
 *  2. Data minimisation — the shape returned to customers deliberately excludes
 *     internal supplier/admin information (supplier id, company name, rating,
 *     verification status) and raw inventory. Exposing that would leak internal
 *     data and risks presenting unverified sourcing as guaranteed. Availability
 *     is derived from `status` only.
 */

// Category shape safe to expose publicly.
function toPublicCategory(category) {
  if (!category) return null;
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
  };
}

// Image shape safe to expose publicly, ordered by sortOrder then creation.
function toPublicImages(images = []) {
  return [...images]
    .sort((a, b) => {
      const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.createdAt) - new Date(b.createdAt);
    })
    .map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt || null,
    }));
}

// Customer-facing availability. For DIRECT_SALE products, reflects in-stock
// status. For SOURCING_REQUIRED products, reflects sourcing request availability.
function toAvailability(
  status,
  purchaseMode = 'SOURCING_REQUIRED',
  stock = null,
) {
  if (purchaseMode === 'DIRECT_SALE') {
    if (status !== 'active') {
      return { code: 'unavailable', label: 'Currently unavailable' };
    }
    if (typeof stock === 'number' && stock <= 0) {
      return { code: 'unavailable', label: 'Out of Stock' };
    }
    return { code: 'available', label: 'In Stock' };
  }

  if (status === 'active') {
    return { code: 'available', label: 'Available for sourcing' };
  }
  return { code: 'unavailable', label: 'Currently unavailable' };
}

/**
 * Map a Prisma product record to the public (customer-facing) shape.
 * @param {object} product Prisma Product with `category` and `images` included.
 */
export function toPublicProduct(product) {
  const isDirectSale = product.purchaseMode === 'DIRECT_SALE';
  return {
    id: product.id,
    title: product.title,
    description: product.description ?? null,
    price: product.price,
    currency: product.currency,
    minimumOrderQty: product.minimumOrderQty ?? null,
    stock: isDirectSale ? product.stock : null,
    status: product.status,
    purchaseMode: product.purchaseMode,
    availableQuantity: isDirectSale ? product.stock : null,
    availability: toAvailability(
      product.status,
      product.purchaseMode,
      product.stock,
    ),
    category: toPublicCategory(product.category),
    images: toPublicImages(product.images),
    createdAt: product.createdAt,
  };
}

/**
 * List active products with pagination, optional search, category filter and
 * whitelisted sort. Runs entirely in the database — never loads the full
 * catalogue into memory.
 *
 * @param {object} params
 * @param {string} [params.q] Free-text term matched against title/description.
 * @param {string} [params.categoryId] Restrict to a single category.
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @param {{field:string,direction:'asc'|'desc'}} [params.sort]
 * @returns {Promise<{ products: object[], pagination: object }>}
 */
export async function listProducts({
  q,
  categoryId,
  page = 1,
  limit = PRODUCT_PAGE_SIZE_DEFAULT,
  sort,
} = {}) {
  const resolvedSort = sort ?? resolveProductSort();

  const where = {
    status: 'active',
    deletedAt: null,
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  // Count + page fetched together; count respects the same filters.
  const [total, records] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { [resolvedSort.field]: resolvedSort.direction },
      skip,
      take: limit,
      include: {
        category: true,
        images: true,
      },
    }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    products: records.map(toPublicProduct),
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

/**
 * Fetch a single active product by id, including images and category.
 * Returns `null` for missing, soft-deleted, or non-active products so callers
 * can respond 404 without leaking the existence of hidden products.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getActiveProductById(id) {
  if (!id) return null;

  const product = await prisma.product.findFirst({
    where: {
      id,
      status: 'active',
      deletedAt: null,
    },
    include: {
      category: true,
      images: true,
    },
  });

  if (!product) return null;

  return toPublicProduct(product);
}

/**
 * List non-deleted categories for browsing/filtering, ordered by name.
 * @returns {Promise<object[]>}
 */
export async function listCategories() {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  });

  return categories.map(toPublicCategory);
}

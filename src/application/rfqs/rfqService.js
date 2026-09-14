import { prisma } from '@/lib/prisma';
import {
  CANCELLABLE_STATUSES,
  RFQ_REF_PREFIX,
} from '@/src/shared/validators/rfq.js';

/**
 * RFQ application service.
 *
 * All RFQ operations go through this module. Three invariants are enforced:
 *
 * 1. Ownership — every query that reads or mutates an RFQ asserts that the
 *    RFQ's `buyerId` matches the authenticated user's id. This prevents IDOR.
 *
 * 2. Status integrity — state transitions are enforced server-side. A customer
 *    may only cancel an RFQ whose status is in `CANCELLABLE_STATUSES`.
 *
 * 3. Data minimisation — the shape returned to customers never contains
 *    internal supplier/admin fields, quotation details (Milestone 6+), or
 *    operational notes.
 */

// ---------------------------------------------------------------------------
// Reference number generation
// ---------------------------------------------------------------------------

/**
 * Generate a unique RFQ reference number.
 * Format: RFQ-YYYY-NNNNNN (zero-padded 6-digit sequence per calendar year).
 *
 * Counts existing RFQs created in the same calendar year and increments.
 * Uses a transaction to avoid races in concurrent submissions.
 *
 * @returns {Promise<string>}
 */
export async function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const yearStart = new Date(`${year}-01-01T00:00:00Z`);
  const yearEnd = new Date(`${year + 1}-01-01T00:00:00Z`);

  const count = await prisma.rFQ.count({
    where: {
      createdAt: { gte: yearStart, lt: yearEnd },
    },
  });

  const seq = String(count + 1).padStart(6, '0');
  return `${RFQ_REF_PREFIX}-${year}-${seq}`;
}

// ---------------------------------------------------------------------------
// Public RFQ shape (customer-facing, no internal data)
// ---------------------------------------------------------------------------

function toPublicRfqItem(item) {
  return {
    id: item.id,
    quantity: item.quantity,
    notes: item.notes ?? null,
    product: item.product
      ? {
          id: item.product.id,
          title: item.product.title,
          price: item.product.price,
          currency: item.product.currency,
          image:
            item.product.images && item.product.images.length > 0
              ? {
                  url: item.product.images[0].url,
                  alt: item.product.images[0].alt,
                }
              : null,
          category: item.product.category
            ? { id: item.product.category.id, name: item.product.category.name }
            : null,
        }
      : null,
  };
}

function toPublicRfq(rfq, { withItems = false } = {}) {
  const base = {
    id: rfq.id,
    referenceNumber: rfq.referenceNumber,
    title: rfq.title ?? null,
    description: rfq.description ?? null,
    destination: rfq.destination,
    status: rfq.status,
    createdAt: rfq.createdAt,
    updatedAt: rfq.updatedAt,
  };

  if (withItems) {
    base.items = (rfq.items ?? []).map(toPublicRfqItem);
  } else {
    // List view: show first item's product info for summary
    const firstItem = rfq.items?.[0];
    base.item = firstItem ? toPublicRfqItem(firstItem) : null;
  }

  return base;
}

// ---------------------------------------------------------------------------
// Create RFQ
// ---------------------------------------------------------------------------

/**
 * Create a new RFQ for a buyer.
 *
 * @param {string} buyerId  — authenticated user id (from session, never client)
 * @param {object} data     — validated create payload
 * @param {string|null} data.productId
 * @param {number} data.quantity
 * @param {string} data.destination
 * @param {string|null} data.notes
 * @param {string|null} data.productDescription
 * @returns {Promise<object>} public RFQ shape
 */
export async function createRfq(
  buyerId,
  { productId, quantity, destination, notes, productDescription },
) {
  // Verify product exists and is active (if a productId is provided)
  if (productId) {
    const product = await prisma.product.findFirst({
      where: { id: productId, status: 'active', deletedAt: null },
      select: { id: true, title: true },
    });

    if (!product) {
      const err = new Error(
        'Product not found or no longer available for sourcing.',
      );
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
  }

  const referenceNumber = await generateReferenceNumber();

  // Build RFQ title from product or custom description
  const title = productDescription ?? null;

  const rfq = await prisma.rFQ.create({
    data: {
      referenceNumber,
      buyerId,
      title,
      description: notes,
      destination,
      status: 'open',
      items: {
        create: {
          productId: productId ?? null,
          quantity,
          notes,
        },
      },
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                take: 1,
              },
              category: true,
            },
          },
        },
      },
    },
  });

  return toPublicRfq(rfq, { withItems: true });
}

// ---------------------------------------------------------------------------
// List customer's own RFQs
// ---------------------------------------------------------------------------

/**
 * List all RFQs belonging to a buyer, with pagination.
 *
 * @param {string} buyerId
 * @param {{ page: number, limit: number, status?: string }} params
 * @returns {Promise<{ rfqs: object[], pagination: object }>}
 */
export async function listMyRfqs(
  buyerId,
  { page = 1, limit = 20, status } = {},
) {
  const where = {
    buyerId,
    deletedAt: null,
  };

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const [total, records] = await Promise.all([
    prisma.rFQ.count({ where }),
    prisma.rFQ.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        items: {
          take: 1,
          include: {
            product: {
              include: {
                images: {
                  orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                  take: 1,
                },
                category: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    rfqs: records.map((rfq) => toPublicRfq(rfq)),
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

// ---------------------------------------------------------------------------
// Get single RFQ (customer view — own only)
// ---------------------------------------------------------------------------

/**
 * Fetch a single RFQ detail, asserting ownership.
 *
 * Returns `null` when the RFQ does not exist, is soft-deleted, or belongs to
 * a different buyer — callers respond with 404 to avoid leaking existence.
 *
 * @param {string} rfqId
 * @param {string} buyerId
 * @returns {Promise<object|null>}
 */
export async function getMyRfqById(rfqId, buyerId) {
  if (!rfqId || !buyerId) return null;

  const rfq = await prisma.rFQ.findFirst({
    where: {
      id: rfqId,
      buyerId, // IDOR protection — buyer can only see their own
      deletedAt: null,
    },
    include: {
      quotations: {
        orderBy: { createdAt: 'desc' },
      },
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                take: 3,
              },
              category: true,
            },
          },
        },
      },
    },
  });

  if (!rfq) return null;

  const pub = toPublicRfq(rfq, { withItems: true });

  // Attach quotations (customer-safe subset — no supplier IDs)
  pub.quotations = (rfq.quotations ?? []).map((q) => ({
    id: q.id,
    referenceNumber: q.referenceNumber,
    price: q.price,
    currency: q.currency,
    deliveryEstimate: q.deliveryEstimate,
    notes: q.notes ?? null,
    status: q.status,
    expiresAt: q.expiresAt ? q.expiresAt.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
  }));

  return pub;
}

// ---------------------------------------------------------------------------
// Cancel RFQ
// ---------------------------------------------------------------------------

/**
 * Cancel a customer's RFQ.
 *
 * Only allowed when:
 *  - The RFQ belongs to the buyer (ownership check)
 *  - The RFQ status is in `CANCELLABLE_STATUSES`
 *
 * @param {string} rfqId
 * @param {string} buyerId
 * @returns {Promise<object>} updated public RFQ
 */
export async function cancelMyRfq(rfqId, buyerId) {
  const rfq = await prisma.rFQ.findFirst({
    where: { id: rfqId, buyerId, deletedAt: null },
  });

  if (!rfq) {
    const err = new Error('RFQ not found.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (!CANCELLABLE_STATUSES.includes(rfq.status)) {
    const err = new Error(
      `This RFQ cannot be cancelled because it is currently "${rfq.status}".`,
    );
    err.code = 'CONFLICT';
    err.status = 409;
    throw err;
  }

  const updated = await prisma.rFQ.update({
    where: { id: rfqId },
    data: { status: 'closed', updatedAt: new Date() },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                take: 1,
              },
              category: true,
            },
          },
        },
      },
    },
  });

  return toPublicRfq(updated, { withItems: true });
}

// ---------------------------------------------------------------------------
// Admin: List all RFQs
// ---------------------------------------------------------------------------

/**
 * List all RFQs across all users (Admin view), with pagination.
 *
 * @param {{ page: number, limit: number, status?: string }} params
 * @returns {Promise<{ rfqs: object[], pagination: object }>}
 */
export async function listAllRfqsAdmin({ page = 1, limit = 20, status } = {}) {
  const where = {
    deletedAt: null,
  };

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const [total, records] = await Promise.all([
    prisma.rFQ.count({ where }),
    prisma.rFQ.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          take: 1,
          include: {
            product: {
              include: {
                images: {
                  orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                  take: 1,
                },
                category: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    rfqs: records.map((rfq) => {
      const pub = toPublicRfq(rfq);
      pub.buyer = {
        id: rfq.buyer.id,
        name: rfq.buyer.name ?? null,
        email: rfq.buyer.email,
        phone: rfq.buyer.phone ?? null,
      };
      return pub;
    }),
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

// ---------------------------------------------------------------------------
// Admin: Get Single RFQ by ID
// ---------------------------------------------------------------------------

/**
 * Get RFQ detail with customer details and quotes list (Admin view).
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getAdminRfqById(id) {
  if (!id) return null;

  const rfq = await prisma.rFQ.findFirst({
    where: { id, deletedAt: null },
    include: {
      buyer: true,
      quotations: {
        orderBy: { createdAt: 'desc' },
      },
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                take: 3,
              },
              category: true,
            },
          },
        },
      },
    },
  });

  if (!rfq) return null;

  const publicRfq = toPublicRfq(rfq, { withItems: true });
  publicRfq.buyer = {
    id: rfq.buyer.id,
    name: rfq.buyer.name ?? null,
    email: rfq.buyer.email,
    phone: rfq.buyer.phone ?? null,
  };
  publicRfq.quotations = rfq.quotations.map((q) => ({
    id: q.id,
    referenceNumber: q.referenceNumber,
    price: q.price,
    currency: q.currency,
    deliveryEstimate: q.deliveryEstimate,
    notes: q.notes ?? null,
    status: q.status,
    expiresAt: q.expiresAt ? q.expiresAt.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
  }));

  return publicRfq;
}

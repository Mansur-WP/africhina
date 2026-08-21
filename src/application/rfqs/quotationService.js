import { prisma } from '@/lib/prisma';
import { createNotification } from '@/src/application/notifications/notificationService.js';

/**
 * Quotation application service.
 *
 * Enforces business rules and authorization policies:
 * 1. Customer Ownership — Buyer must own the RFQ associated with a quotation
 *    to accept/reject or read it (IDOR protection).
 * 2. Expiration Checks — Prevents accepting expired quotations.
 * 3. Consistent Transitions — Updates RFQ status in sync with quotation status
 *    (e.g., Quotation Accepted -> RFQ Accepted, Quotation Rejected -> RFQ Open).
 */

// ---------------------------------------------------------------------------
// Reference number generation
// ---------------------------------------------------------------------------

export async function generateQuotationReferenceNumber() {
  const year = new Date().getFullYear();
  const yearStart = new Date(`${year}-01-01T00:00:00Z`);
  const yearEnd = new Date(`${year + 1}-01-01T00:00:00Z`);

  const count = await prisma.quotation.count({
    where: {
      createdAt: { gte: yearStart, lt: yearEnd },
    },
  });

  const seq = String(count + 1).padStart(6, '0');
  return `QTN-${year}-${seq}`;
}

// ---------------------------------------------------------------------------
// Public shape mapping
// ---------------------------------------------------------------------------

function toPublicQuotation(q) {
  if (!q) return null;
  return {
    id: q.id,
    referenceNumber: q.referenceNumber,
    rfqId: q.rfqId,
    supplierId: q.supplierId,
    price: q.price,
    currency: q.currency,
    deliveryEstimate: q.deliveryEstimate,
    notes: q.notes ?? null,
    status: q.status,
    expiresAt: q.expiresAt ? q.expiresAt.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    rfq: q.rfq
      ? {
          id: q.rfq.id,
          referenceNumber: q.rfq.referenceNumber,
          title: q.rfq.title ?? null,
          destination: q.rfq.destination,
          status: q.rfq.status,
          buyer: q.rfq.buyer
            ? {
                id: q.rfq.buyer.id,
                name: q.rfq.buyer.name ?? null,
                email: q.rfq.buyer.email,
                phone: q.rfq.buyer.phone ?? null,
              }
            : null,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Admin: Create Quotation
// ---------------------------------------------------------------------------

export async function createQuotation(
  rfqId,
  { price, currency, deliveryEstimate, notes, validDays = 14 },
) {
  // Find RFQ
  const rfq = await prisma.rFQ.findFirst({
    where: { id: rfqId, deletedAt: null },
  });

  if (!rfq) {
    const err = new Error('RFQ not found.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Only allow quoting for 'open' or 'quoted' RFQs (can append/update quote)
  if (rfq.status !== 'open' && rfq.status !== 'quoted') {
    const err = new Error(
      `Cannot create a quotation for an RFQ in status "${rfq.status}".`,
    );
    err.code = 'CONFLICT';
    err.status = 409;
    throw err;
  }

  // Resolve dev supplier from the database to satisfy database relation
  const supplier = await prisma.supplier.findFirst();
  if (!supplier) {
    const err = new Error(
      'No suppliers found in the database to fulfill relation.',
    );
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const referenceNumber = await generateQuotationReferenceNumber();
  const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

  // Execute inside transaction to ensure consistent status updates
  const quotation = await prisma.$transaction(async (tx) => {
    // If there is an existing pending quotation, reject it to prevent duplicates
    await tx.quotation.updateMany({
      where: { rfqId, status: 'pending' },
      data: { status: 'rejected' },
    });

    const newQuote = await tx.quotation.create({
      data: {
        referenceNumber,
        rfqId,
        supplierId: supplier.id,
        price,
        currency,
        deliveryEstimate,
        notes,
        status: 'pending',
        expiresAt,
      },
      include: {
        rfq: {
          include: {
            buyer: true,
          },
        },
      },
    });

    // Update RFQ status to 'quoted'
    await tx.rFQ.update({
      where: { id: rfqId },
      data: { status: 'quoted', updatedAt: new Date() },
    });

    return newQuote;
  });

  if (quotation?.rfq?.buyer?.id) {
    try {
      await createNotification({
        userId: quotation.rfq.buyer.id,
        type: 'quotation',
        title: 'Quotation Received',
        body: `A quotation (${quotation.referenceNumber}) has been prepared for your request "${quotation.rfq.title || 'Sourcing Request'}".`,
      });
    } catch (err) {
      console.error('Failed to create quotation notification:', err);
    }
  }

  return toPublicQuotation(quotation);
}

// ---------------------------------------------------------------------------
// Customer: Accept Quotation
// ---------------------------------------------------------------------------

export async function acceptQuotation(quotationId, buyerId) {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId },
    include: { rfq: true },
  });

  if (!quotation) {
    const err = new Error('Quotation not found.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // IDOR Protection — Check that the buyer owns the associated RFQ
  if (quotation.rfq.buyerId !== buyerId) {
    const err = new Error('Access denied.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  if (quotation.status !== 'pending') {
    const err = new Error(
      `This quotation cannot be accepted because it is currently "${quotation.status}".`,
    );
    err.code = 'CONFLICT';
    err.status = 409;
    throw err;
  }

  // Expiration check
  if (quotation.expiresAt && quotation.expiresAt < new Date()) {
    const err = new Error('This quotation has expired and cannot be accepted.');
    err.code = 'CONFLICT';
    err.status = 409;
    throw err;
  }

  // Update Quotation to 'accepted' and RFQ to 'accepted' in transaction
  const updated = await prisma.$transaction(async (tx) => {
    const q = await tx.quotation.update({
      where: { id: quotationId },
      data: { status: 'accepted', updatedAt: new Date() },
      include: {
        rfq: {
          include: {
            buyer: true,
          },
        },
      },
    });

    await tx.rFQ.update({
      where: { id: quotation.rfqId },
      data: { status: 'accepted', updatedAt: new Date() },
    });

    return q;
  });

  if (updated?.rfq?.buyer?.id) {
    try {
      await createNotification({
        userId: updated.rfq.buyer.id,
        type: 'quotation',
        title: 'Quotation Accepted',
        body: `You accepted quotation ${updated.referenceNumber}. Your order will be prepared shortly.`,
      });
    } catch (err) {
      console.error('Failed to create quotation accept notification:', err);
    }
  }

  return toPublicQuotation(updated);
}

// ---------------------------------------------------------------------------
// Customer: Reject Quotation
// ---------------------------------------------------------------------------

export async function rejectQuotation(quotationId, buyerId) {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId },
    include: { rfq: true },
  });

  if (!quotation) {
    const err = new Error('Quotation not found.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // IDOR Protection — Check that the buyer owns the associated RFQ
  if (quotation.rfq.buyerId !== buyerId) {
    const err = new Error('Access denied.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  if (quotation.status !== 'pending') {
    const err = new Error(
      `This quotation cannot be rejected because it is currently "${quotation.status}".`,
    );
    err.code = 'CONFLICT';
    err.status = 409;
    throw err;
  }

  // Update Quotation to 'rejected' and RFQ back to 'open' in transaction
  const updated = await prisma.$transaction(async (tx) => {
    const q = await tx.quotation.update({
      where: { id: quotationId },
      data: { status: 'rejected', updatedAt: new Date() },
      include: {
        rfq: {
          include: {
            buyer: true,
          },
        },
      },
    });

    await tx.rFQ.update({
      where: { id: quotation.rfqId },
      data: { status: 'open', updatedAt: new Date() },
    });

    return q;
  });

  if (updated?.rfq?.buyer?.id) {
    try {
      await createNotification({
        userId: updated.rfq.buyer.id,
        type: 'quotation',
        title: 'Quotation Declined',
        body: `You declined quotation ${updated.referenceNumber}.`,
      });
    } catch (err) {
      console.error('Failed to create quotation reject notification:', err);
    }
  }

  return toPublicQuotation(updated);
}

// ---------------------------------------------------------------------------
// Customer: Get Quotation by ID
// ---------------------------------------------------------------------------

export async function getQuotationById(quotationId, buyerId) {
  const q = await prisma.quotation.findFirst({
    where: { id: quotationId },
    include: {
      rfq: {
        include: {
          buyer: true,
        },
      },
    },
  });

  if (!q) return null;

  // IDOR protection
  if (q.rfq.buyerId !== buyerId) {
    return null;
  }

  return toPublicQuotation(q);
}

// ---------------------------------------------------------------------------
// Customer: List Own Quotations
// ---------------------------------------------------------------------------

export async function listCustomerQuotations(
  buyerId,
  { page = 1, limit = 20 } = {},
) {
  const where = {
    rfq: {
      buyerId,
      deletedAt: null,
    },
  };

  const skip = (page - 1) * limit;

  const [total, records] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        rfq: {
          include: {
            buyer: true,
          },
        },
      },
    }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    quotations: records.map(toPublicQuotation),
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

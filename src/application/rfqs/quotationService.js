import { prisma } from '@/lib/prisma';
import { createNotification } from '@/src/application/notifications/notificationService.js';
import { createOrderFromAcceptedQuotation } from '@/src/application/orders/orderService.js';
import {
  QUOTATION_FINANCIAL_FIELDS,
  calculateQuotationTotal,
  isQuotationExpired,
} from './quotationRules.js';

export const FINANCIAL_FIELDS = QUOTATION_FINANCIAL_FIELDS;
export const totalFinancials = calculateQuotationTotal;
export const isExpired = isQuotationExpired;

function quotationInclude() {
  return {
    rfq: {
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          take: 1,
          include: {
            product: {
              include: {
                category: true,
                images: {
                  orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                  take: 1,
                },
              },
            },
          },
        },
      },
    },
  };
}

function toPublicQuotation(quotation) {
  if (!quotation) return null;
  const item = quotation.rfq?.items?.[0];
  const buyer = quotation.rfq?.buyer;
  return {
    id: quotation.id,
    referenceNumber: quotation.referenceNumber,
    rfqId: quotation.rfqId,
    supplierId: quotation.supplierId,
    productCost: quotation.productCost,
    chinaShippingCost: quotation.chinaShippingCost,
    inspectionCost: quotation.inspectionCost,
    internationalFreightCost: quotation.internationalFreightCost,
    customsCost: quotation.customsCost,
    serviceFee: quotation.serviceFee,
    otherCharges: quotation.otherCharges,
    total: quotation.total,
    price: quotation.total,
    currency: quotation.currency,
    deliveryEstimate: quotation.deliveryEstimate,
    notes: quotation.notes ?? null,
    status: quotation.status,
    expired: isExpired(quotation),
    expiresAt: quotation.expiresAt?.toISOString() ?? null,
    sentAt: quotation.sentAt?.toISOString() ?? null,
    acceptedAt: quotation.acceptedAt?.toISOString() ?? null,
    rejectedAt: quotation.rejectedAt?.toISOString() ?? null,
    createdAt: quotation.createdAt.toISOString(),
    updatedAt: quotation.updatedAt.toISOString(),
    rfq: quotation.rfq
      ? {
          id: quotation.rfq.id,
          referenceNumber: quotation.rfq.referenceNumber,
          title: quotation.rfq.title ?? null,
          description: quotation.rfq.description ?? null,
          destination: quotation.rfq.destination,
          status: quotation.rfq.status,
          buyer: buyer
            ? {
                id: buyer.id,
                name: buyer.name ?? null,
                email: buyer.email,
                phone: buyer.phone ?? null,
              }
            : null,
          item: item
            ? {
                quantity: item.quantity,
                notes: item.notes ?? null,
                product: item.product
                  ? {
                      id: item.product.id,
                      title: item.product.title,
                      category: item.product.category?.name ?? null,
                      image: item.product.images?.[0]?.url ?? null,
                    }
                  : null,
              }
            : null,
        }
      : null,
  };
}

function legacyFinancials(input) {
  if (
    input.price !== undefined &&
    !FINANCIAL_FIELDS.some((field) => input[field] > 0)
  ) {
    return {
      productCost: input.price,
      chinaShippingCost: 0,
      inspectionCost: 0,
      internationalFreightCost: 0,
      customsCost: 0,
      serviceFee: 0,
      otherCharges: 0,
    };
  }
  return Object.fromEntries(
    FINANCIAL_FIELDS.map((field) => [field, input[field] ?? 0]),
  );
}

function expirationFromInput(input) {
  if (input.expiresAt) return input.expiresAt;
  return new Date(Date.now() + (input.validDays ?? 14) * 24 * 60 * 60 * 1000);
}

async function notifyAdmins(title, body) {
  const admins = await prisma.user.findMany({
    where: { role: { code: 'admin' }, status: 'active', deletedAt: null },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification({ userId: admin.id, type: 'system', title, body }),
    ),
  );
}

export async function generateQuotationReferenceNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.quotation.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00Z`),
        lt: new Date(`${year + 1}-01-01T00:00:00Z`),
      },
    },
  });
  return `AC-Q-${year}-${String(count + 1).padStart(5, '0')}`;
}

async function getEligibleRfq(rfqId) {
  const rfq = await prisma.rFQ.findFirst({
    where: { id: rfqId, deletedAt: null },
  });
  if (!rfq) {
    const error = new Error('RFQ not found.');
    error.code = 'NOT_FOUND';
    error.status = 404;
    throw error;
  }
  if (!['open', 'quoted'].includes(rfq.status)) {
    const error = new Error(
      `RFQ is not eligible for quotation in status "${rfq.status}".`,
    );
    error.code = 'CONFLICT';
    error.status = 409;
    throw error;
  }
  return rfq;
}

export async function createQuotation(rfqId, input) {
  await getEligibleRfq(rfqId);
  const supplier = await prisma.supplier.findFirst({ select: { id: true } });
  if (!supplier) {
    const error = new Error('No supplier is available for this quotation.');
    error.code = 'NOT_FOUND';
    error.status = 404;
    throw error;
  }
  const financials = legacyFinancials(input);
  const quotation = await prisma.quotation.create({
    data: {
      ...financials,
      total: totalFinancials(financials),
      referenceNumber: await generateQuotationReferenceNumber(),
      rfqId,
      supplierId: supplier.id,
      currency: input.currency,
      deliveryEstimate: input.deliveryEstimate,
      notes: input.notes ?? null,
      status: 'draft',
      expiresAt: expirationFromInput(input),
    },
    include: quotationInclude(),
  });
  return toPublicQuotation(quotation);
}

export async function updateQuotation(quotationId, input) {
  const existing = await prisma.quotation.findUnique({
    where: { id: quotationId },
  });
  if (!existing) return null;
  if (existing.status !== 'draft') {
    const error = new Error('Only draft quotations can be edited.');
    error.code = 'CONFLICT';
    error.status = 409;
    throw error;
  }
  const financials = legacyFinancials(input);
  const quotation = await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      ...financials,
      total: totalFinancials(financials),
      currency: input.currency,
      deliveryEstimate: input.deliveryEstimate,
      notes: input.notes ?? null,
      expiresAt: expirationFromInput(input),
    },
    include: quotationInclude(),
  });
  return toPublicQuotation(quotation);
}

export async function sendQuotation(quotationId) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: quotationInclude(),
  });
  if (!quotation) return null;
  if (quotation.status !== 'draft') {
    const error = new Error('Only draft quotations can be sent.');
    error.code = 'CONFLICT';
    error.status = 409;
    throw error;
  }
  if (!quotation.expiresAt || isExpired(quotation)) {
    const error = new Error('A quotation must have a future expiration date.');
    error.code = 'VALIDATION_ERROR';
    error.status = 422;
    throw error;
  }
  const updated = await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: 'sent', sentAt: new Date() },
    include: quotationInclude(),
  });
  await createNotification({
    userId: updated.rfq.buyer.id,
    type: 'system',
    title: 'Quotation Received',
    body: `Quotation ${updated.referenceNumber} is ready for your review.`,
  });
  return toPublicQuotation(updated);
}

async function getOwnedQuotation(quotationId, buyerId) {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, rfq: { buyerId, deletedAt: null } },
    include: quotationInclude(),
  });
  if (!quotation) {
    const error = new Error('Quotation not found.');
    error.code = 'NOT_FOUND';
    error.status = 404;
    throw error;
  }
  return quotation;
}

export async function acceptQuotation(quotationId, buyerId) {
  const result = await createOrderFromAcceptedQuotation(quotationId, buyerId);
  const updated = await getOwnedQuotation(quotationId, buyerId);
  if (result.acceptedNow) {
    await notifyAdmins(
      'Quotation Accepted',
      `Customer accepted quotation ${updated.referenceNumber}.`,
    );
  }
  return { quotation: toPublicQuotation(updated), order: result.order };
}

export async function rejectQuotation(quotationId, buyerId) {
  const quotation = await getOwnedQuotation(quotationId, buyerId);
  if (quotation.status !== 'sent') {
    const error = new Error('Only sent quotations can be rejected.');
    error.code = 'CONFLICT';
    error.status = 409;
    throw error;
  }
  if (isExpired(quotation)) {
    const error = new Error(
      'This quotation has expired and cannot be rejected.',
    );
    error.code = 'CONFLICT';
    error.status = 409;
    throw error;
  }
  const updated = await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: 'rejected', rejectedAt: new Date() },
    include: quotationInclude(),
  });
  await notifyAdmins(
    'Quotation Rejected',
    `Customer rejected quotation ${updated.referenceNumber}.`,
  );
  return toPublicQuotation(updated);
}

export async function getQuotationById(quotationId, buyerId) {
  try {
    return toPublicQuotation(await getOwnedQuotation(quotationId, buyerId));
  } catch (error) {
    if (error.code === 'NOT_FOUND') return null;
    throw error;
  }
}

export async function listCustomerQuotations(
  buyerId,
  { page = 1, limit = 20 } = {},
) {
  const where = { rfq: { buyerId, deletedAt: null } };
  const [total, records] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: quotationInclude(),
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

export async function listAdminQuotations({
  page = 1,
  limit = 20,
  status,
} = {}) {
  const where = status ? { status } : {};
  const [total, records] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: quotationInclude(),
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
      hasPrevPage: page > 1,
    },
  };
}

export async function getAdminQuotationStats() {
  const [issued, accepted] = await Promise.all([
    prisma.quotation.count({ where: { status: 'sent' } }),
    prisma.quotation.count({ where: { status: 'accepted' } }),
  ]);

  return { issued, accepted };
}

export async function getAdminQuotationById(quotationId) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: quotationInclude(),
  });
  return toPublicQuotation(quotation);
}

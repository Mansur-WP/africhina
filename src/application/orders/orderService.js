import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/src/application/notifications/notificationService.js';
import {
  isCheckoutEligible,
  quotationSnapshot,
} from '@/src/domain/orders/orderRules.js';

function orderInclude() {
  return {
    buyer: { select: { id: true, name: true, email: true, phone: true } },
    supplier: { select: { id: true, companyName: true } },
    quotation: { select: { id: true, referenceNumber: true } },
    items: {
      orderBy: { id: 'asc' },
      include: {
        product: { select: { id: true, title: true, currency: true } },
      },
    },
  };
}

function orderReference() {
  const year = new Date().getFullYear();
  return `AC-O-${year}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

function toPublicOrder(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    buyerId: order.buyerId,
    supplierId: order.supplierId,
    quotationId: order.quotationId,
    purchaseIntentId: order.purchaseIntentId,
    purchaseMode: order.purchaseMode,
    status: order.status,
    paymentStatus: order.status === 'pending_payment' ? 'pending' : null,
    productCost: order.productCost,
    chinaShippingCost: order.chinaShippingCost,
    inspectionCost: order.inspectionCost,
    internationalFreightCost: order.internationalFreightCost,
    customsCost: order.customsCost,
    serviceFee: order.serviceFee,
    otherCharges: order.otherCharges,
    totalAmount: order.totalAmount,
    currency: order.currency,
    shippingAddress: order.shippingAddress ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    buyer: order.buyer ?? null,
    supplier: order.supplier ?? null,
    quotation: order.quotation ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productTitle: item.productTitle,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      product: item.product ?? null,
    })),
  };
}

function conflict(message) {
  const error = new Error(message);
  error.code = 'CONFLICT';
  error.status = 409;
  return error;
}

function notFound(message = 'Order not found.') {
  const error = new Error(message);
  error.code = 'NOT_FOUND';
  error.status = 404;
  return error;
}

function assertAcceptedQuotation(quotation) {
  if (!quotation) throw notFound('Quotation not found.');
  if (quotation.status !== 'accepted') {
    throw conflict('Only accepted quotations can create an order.');
  }
  if (quotation.expiresAt && quotation.expiresAt < new Date()) {
    throw conflict('This quotation has expired and cannot create an order.');
  }
}

async function createOrderTransaction(tx, quotation, buyerId) {
  const items = quotation.rfq.items.length
    ? quotation.rfq.items
    : [{ productId: null, quantity: 1 }];
  const productCost = quotation.productCost;

  const order = await tx.order.create({
    data: {
      orderNumber: orderReference(),
      buyerId,
      supplierId: quotation.supplierId,
      quotationId: quotation.id,
      purchaseMode: 'SOURCING_REQUIRED',
      status: 'draft',
      ...quotationSnapshot(quotation),
      totalAmount: quotation.total,
      currency: quotation.currency,
    },
    select: { id: true, orderNumber: true },
  });

  await tx.orderItem.createMany({
    data: items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      productTitle: item.product?.title ?? 'Custom sourcing item',
      quantity: item.quantity || 1,
      unitPrice: Math.floor(productCost / (item.quantity || 1)),
      currency: quotation.currency,
      subtotal: productCost,
    })),
  });

  return { order, created: true };
}

async function notifyAdmins(title, body) {
  const admins = await prisma.user.findMany({
    where: { role: { code: 'admin' }, status: 'active', deletedAt: null },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification({ userId: admin.id, type: 'order', title, body }),
    ),
  );
}

export async function createOrderFromAcceptedQuotation(quotationId, buyerId) {
  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findFirst({
        where: { id: quotationId, rfq: { buyerId, deletedAt: null } },
        select: {
          id: true,
          supplierId: true,
          productCost: true,
          chinaShippingCost: true,
          inspectionCost: true,
          internationalFreightCost: true,
          customsCost: true,
          serviceFee: true,
          otherCharges: true,
          total: true,
          currency: true,
          status: true,
          expiresAt: true,
          rfq: {
            select: {
              items: {
                select: {
                  productId: true,
                  quantity: true,
                  product: { select: { title: true } },
                },
              },
            },
          },
        },
      });
      if (!quotation) throw notFound('Quotation not found.');
      const acceptedNow = quotation.status === 'sent';
      if (quotation.status === 'sent') {
        if (quotation.expiresAt && quotation.expiresAt < new Date()) {
          throw conflict('This quotation has expired and cannot be accepted.');
        }
        const accepted = await tx.quotation.update({
          where: { id: quotation.id },
          data: { status: 'accepted', acceptedAt: new Date() },
        });
        Object.assign(quotation, accepted);
      } else {
        assertAcceptedQuotation(quotation);
      }
      const result = await createOrderTransaction(tx, quotation, buyerId);
      return { quotation, acceptedNow, ...result };
    });
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('quotationId')) {
      const existing = await prisma.order.findUnique({
        where: { quotationId },
        include: orderInclude(),
      });
      if (existing) {
        const quotation = await prisma.quotation.findUnique({
          where: { id: quotationId },
        });
        return {
          quotation,
          acceptedNow: false,
          created: false,
          order: toPublicOrder(existing),
        };
      }
    }
    throw error;
  }

  if (result.created) {
    try {
      await createNotification({
        userId: buyerId,
        type: 'order',
        title: 'Order Created',
        body: `Order ${result.order.orderNumber} is ready for review.`,
      });
    } catch {
      // The committed order remains available even if notification delivery fails.
    }
  }
  const [quotation, order] = await Promise.all([
    prisma.quotation.findUnique({ where: { id: quotationId } }),
    prisma.order.findUnique({
      where: { id: result.order.id },
      include: orderInclude(),
    }),
  ]);
  return { quotation, order: toPublicOrder(order) };
}

export async function listCustomerOrders(
  buyerId,
  { page = 1, limit = 20 } = {},
) {
  const where = { buyerId };
  const [total, records] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: orderInclude(),
    }),
  ]);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    orders: records.map(toPublicOrder),
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

export async function getCustomerOrder(orderId, buyerId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId },
    include: orderInclude(),
  });
  return order ? toPublicOrder(order) : null;
}

export async function confirmOrderCheckout(orderId, buyerId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId },
    include: orderInclude(),
  });
  if (!order) throw notFound();
  if (order.status === 'pending_payment') return toPublicOrder(order);
  if (!isCheckoutEligible(order.status)) {
    throw conflict('This order is not eligible for checkout.');
  }
  const updated = await prisma.order.updateMany({
    where: { id: orderId, buyerId, status: 'draft' },
    data: { status: 'pending_payment' },
  });
  if (updated.count === 0) {
    const current = await getCustomerOrder(orderId, buyerId);
    if (current?.status === 'pending_payment') return current;
    throw conflict('This order is not eligible for checkout.');
  }
  const confirmed = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude(),
  });
  try {
    await createNotification({
      userId: buyerId,
      type: 'order',
      title: 'Checkout Confirmed',
      body: `Order ${confirmed.orderNumber} is pending payment.`,
    });
    await notifyAdmins(
      'Checkout Confirmed',
      `Order ${confirmed.orderNumber} is pending payment.`,
    );
  } catch {
    // Checkout state is authoritative; notification delivery is best effort.
  }
  return toPublicOrder(confirmed);
}

export async function listAdminOrders({ page = 1, limit = 20 } = {}) {
  const where = {};
  const [total, records] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: orderInclude(),
    }),
  ]);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    orders: records.map(toPublicOrder),
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

export async function getAdminOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude(),
  });
  return order ? toPublicOrder(order) : null;
}

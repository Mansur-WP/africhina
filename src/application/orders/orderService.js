import crypto from 'crypto';
import { prisma } from '../../../lib/prisma.js';
import { createNotification } from '../notifications/notificationService.js';
import {
  isCheckoutEligible,
  quotationSnapshot,
  assertFulfillmentTransition,
  isShipmentEligible,
} from '../../domain/orders/orderRules.js';

function orderInclude() {
  return {
    buyer: { select: { id: true, name: true, email: true, phone: true } },
    supplier: { select: { id: true, companyName: true } },
    quotation: { select: { id: true, referenceNumber: true, rfqId: true } },
    invoice: { select: { id: true, invoiceNumber: true, createdAt: true } },
    items: {
      orderBy: { id: 'asc' },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            currency: true,
            images: { select: { url: true, alt: true }, take: 1 },
          },
        },
      },
    },
    shipments: {
      select: {
        id: true,
        carrier: true,
        trackingNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        events: {
          orderBy: { occurredAt: 'desc' },
          select: {
            id: true,
            status: true,
            description: true,
            location: true,
            occurredAt: true,
          },
        },
      },
    },
  };
}

function orderReference() {
  const year = new Date().getFullYear();
  return `AC-O-${year}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

export function toPublicOrder(order) {
  const shipment = order.shipments?.[0]
    ? {
        id: order.shipments[0].id,
        carrier: order.shipments[0].carrier ?? null,
        trackingNumber: order.shipments[0].trackingNumber ?? null,
        status: order.shipments[0].status ?? null,
        createdAt: order.shipments[0].createdAt?.toISOString?.() ?? null,
        events: (order.shipments[0].events ?? []).map((e) => ({
          id: e.id,
          status: e.status,
          description: e.description,
          location: e.location,
          occurredAt: e.occurredAt?.toISOString?.() ?? null,
        })),
      }
    : null;

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
    shipment,
    invoice: order.invoice
      ? {
          id: order.invoice.id,
          invoiceNumber: order.invoice.invoiceNumber,
          createdAt:
            order.invoice.createdAt?.toISOString?.() ??
            new Date(order.invoice.createdAt).toISOString(),
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productTitle: item.productTitle || item.product?.title || 'Order item',
      imageUrl: item.product?.images?.[0]?.url ?? null,
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

function validationError(message) {
  const error = new Error(message);
  error.code = 'VALIDATION_ERROR';
  error.status = 422;
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

export async function createOrderFromAcceptedQuotation(
  quotationId,
  buyerId,
  client = prisma,
  notify = createNotification,
) {
  // Preload and validate outside transaction
  const quotation = await client.quotation.findFirst({
    where: { id: quotationId, rfq: { buyerId, deletedAt: null } },
    include: {
      rfq: {
        select: {
          id: true,
          buyerId: true,
          status: true,
          title: true,
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              product: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  });

  if (!quotation) throw notFound('Quotation not found.');

  // Check idempotency first: if order already exists for this quotation, return it
  const existingOrder = await client.order.findUnique({
    where: { quotationId },
    include: orderInclude(),
  });
  if (existingOrder) {
    return {
      quotation,
      acceptedNow: false,
      created: false,
      order: toPublicOrder(existingOrder),
    };
  }

  // Verify quotation status
  if (quotation.status === 'rejected') {
    throw conflict('This quotation has been declined and cannot be accepted.');
  }
  if (quotation.status !== 'sent' && quotation.status !== 'accepted') {
    throw conflict('Only sent quotations can be accepted.');
  }
  if (quotation.expiresAt && quotation.expiresAt < new Date()) {
    throw conflict('This quotation has expired and cannot be accepted.');
  }

  // Verify financial data readiness
  if (
    !quotation.total ||
    quotation.total <= 0 ||
    !quotation.productCost ||
    quotation.productCost <= 0
  ) {
    throw validationError(
      'Quotation is missing required financial data and cannot be accepted.',
    );
  }

  // Pre-generate order reference and items outside the transaction
  const orderNumber = orderReference();
  const rfqItems = quotation.rfq?.items?.length
    ? quotation.rfq.items
    : [{ productId: null, quantity: 1, product: null }];
  const snapshot = quotationSnapshot(quotation);
  const authoritativeTotal = quotation.total;
  const productCost = quotation.productCost;

  let result;
  try {
    result = await client.$transaction(
      async (tx) => {
        // 1. Atomically update quotation status if sent and not expired
        const updatedQuotation = await tx.quotation.updateMany({
          where: {
            id: quotation.id,
            status: 'sent',
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
          },
          data: {
            status: 'accepted',
            acceptedAt: new Date(),
          },
        });

        let acceptedNow = false;
        if (updatedQuotation.count === 1) {
          acceptedNow = true;
        } else {
          // Concurrency / state re-verification inside transaction
          const current = await tx.quotation.findUnique({
            where: { id: quotation.id },
            select: { status: true, expiresAt: true },
          });
          if (!current) throw notFound('Quotation not found.');
          if (current.status === 'rejected') {
            throw conflict(
              'This quotation has been declined and cannot be accepted.',
            );
          }
          if (current.expiresAt && current.expiresAt < new Date()) {
            throw conflict(
              'This quotation has expired and cannot be accepted.',
            );
          }
          if (current.status !== 'accepted') {
            throw conflict('Only sent quotations can be accepted.');
          }
        }

        // 2. Update RFQ status to 'accepted'
        if (quotation.rfqId) {
          await tx.rFQ.update({
            where: { id: quotation.rfqId },
            data: { status: 'accepted' },
          });
        }

        // 3. Create Order with authoritative quotation snapshot
        const order = await tx.order.create({
          data: {
            orderNumber,
            buyerId,
            supplierId: quotation.supplierId,
            quotationId: quotation.id,
            purchaseMode: 'SOURCING_REQUIRED',
            status: 'draft',
            ...snapshot,
            totalAmount: authoritativeTotal,
            currency: quotation.currency,
          },
          select: { id: true, orderNumber: true },
        });

        // 4. Create OrderItem records with authoritative snapshot pricing
        await tx.orderItem.createMany({
          data: rfqItems.map((item) => {
            const qty = item.quantity || 1;
            return {
              orderId: order.id,
              productId: item.productId,
              productTitle:
                item.product?.title ??
                quotation.rfq?.title ??
                'Custom sourcing item',
              quantity: qty,
              unitPrice: Math.floor(productCost / qty),
              currency: quotation.currency,
              subtotal: productCost,
            };
          }),
        });

        return { order, acceptedNow, created: true };
      },
      { maxWait: 15000, timeout: 30000 },
    );
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('quotationId')) {
      const existing = await client.order.findUnique({
        where: { quotationId },
        include: orderInclude(),
      });
      if (existing) {
        const freshQuotation = await client.quotation.findUnique({
          where: { id: quotationId },
        });
        return {
          quotation: freshQuotation,
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
      await notify({
        userId: buyerId,
        type: 'order',
        title: 'Order Created',
        body: `Order ${result.order.orderNumber} is ready for review.`,
      });
    } catch {
      // The committed order remains available even if notification delivery fails.
    }
  }

  const [freshQuotation, freshOrder] = await Promise.all([
    client.quotation.findUnique({ where: { id: quotationId } }),
    client.order.findUnique({
      where: { id: result.order.id },
      include: orderInclude(),
    }),
  ]);

  return {
    quotation: freshQuotation,
    acceptedNow: result.acceptedNow,
    created: result.created,
    order: toPublicOrder(freshOrder),
  };
}

export async function getCustomerOrderStats(buyerId) {
  try {
    const counts = await prisma.order.groupBy({
      by: ['status'],
      where: { buyerId },
      _count: { status: true },
    });

    let total = 0;
    let pendingPayment = 0;
    let active = 0;
    let delivered = 0;

    for (const row of counts) {
      const count = row._count?.status || 0;
      total += count;
      if (['pending_payment', 'draft'].includes(row.status)) {
        pendingPayment += count;
      } else if (
        [
          'paid',
          'in_production',
          'ready_to_ship',
          'shipped',
          'in_customs',
        ].includes(row.status)
      ) {
        active += count;
      } else if (row.status === 'delivered') {
        delivered += count;
      }
    }

    return { total, pendingPayment, active, delivered };
  } catch {
    return { total: 0, pendingPayment: 0, active: 0, delivered: 0 };
  }
}

export async function listCustomerOrders(
  buyerId,
  { page = 1, limit = 20 } = {},
) {
  const where = { buyerId };
  try {
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
  } catch (error) {
    if (
      error?.message?.includes('connection') ||
      error?.message?.includes('TLS') ||
      error?.message?.includes("Can't reach database server") ||
      error?.code === 'P1001'
    ) {
      try {
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
      } catch {
        return {
          orders: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
    }
    throw error;
  }
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

export async function listAdminOrders({
  page = 1,
  limit = 20,
  status = null,
  purchaseMode = null,
} = {}) {
  const where = {};
  if (status) where.status = status;
  if (purchaseMode) where.purchaseMode = purchaseMode;
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

export async function getAdminOrdersStats() {
  try {
    const counts = await prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    const byStatus = {};
    let total = 0;
    for (const row of counts) {
      byStatus[row.status] = row._count.status;
      total += row._count.status;
    }
    return { total, byStatus };
  } catch {
    return { total: 0, byStatus: {} };
  }
}

export async function getAdminOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      ...orderInclude(),
      payments: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          provider: true,
          providerRef: true,
          amount: true,
          currency: true,
          status: true,
          verifiedAt: true,
          createdAt: true,
        },
      },
      invoice: { select: { id: true, invoiceNumber: true, createdAt: true } },
    },
  });
  if (!order) return null;
  const pub = toPublicOrder(order);
  pub.payments = order.payments ?? [];
  pub.invoice = order.invoice ?? null;
  return pub;
}

// ---------------------------------------------------------------------------
// Fulfillment — status transitions
// ---------------------------------------------------------------------------

export async function advanceOrderStatus(
  orderId,
  adminId,
  nextStatus,
  { note } = {},
  client = prisma,
) {
  const order = await client.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, orderNumber: true, buyerId: true },
  });
  if (!order) {
    const err = new Error('Order not found.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Server-side transition validation — cannot be bypassed by UI.
  assertFulfillmentTransition(order.status, nextStatus);

  const updated = await client.order.update({
    where: { id: orderId },
    data: { status: nextStatus },
    select: { id: true, status: true, orderNumber: true },
  });

  // Notify buyer of status change (best-effort).
  try {
    const labels = {
      in_production: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      completed: 'Completed',
    };
    const label = labels[nextStatus] || nextStatus;
    await createNotification({
      userId: order.buyerId,
      type: 'order',
      title: `Order ${label}`,
      body: `Order ${order.orderNumber} is now ${label.toLowerCase()}.${
        note ? ' ' + note : ''
      }`,
    });
  } catch {
    // Notification failure never rolls back the status update.
  }

  return updated;
}

// ---------------------------------------------------------------------------
// Fulfillment — shipment management
// ---------------------------------------------------------------------------

export async function createOrUpdateShipment(
  orderId,
  adminId,
  { carrier, trackingNumber, eventDescription, eventLocation } = {},
  client = prisma,
) {
  const order = await client.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });
  if (!order) {
    const err = new Error('Order not found.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }
  if (!isShipmentEligible(order.status)) {
    const err = new Error(
      'A shipment can only be created for paid or active fulfillment orders.',
    );
    err.code = 'CONFLICT';
    err.status = 409;
    throw err;
  }

  const existing = await client.shipment.findUnique({
    where: { orderId },
    select: { id: true },
  });

  let shipment;
  if (existing) {
    shipment = await client.shipment.update({
      where: { id: existing.id },
      data: {
        ...(carrier !== undefined && { carrier }),
        ...(trackingNumber !== undefined && { trackingNumber }),
      },
      select: {
        id: true,
        orderId: true,
        carrier: true,
        trackingNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } else {
    shipment = await client.shipment.create({
      data: {
        orderId,
        assigneeId: adminId ?? null,
        carrier: carrier ?? null,
        trackingNumber: trackingNumber ?? null,
        status: 'preparing',
      },
      select: {
        id: true,
        orderId: true,
        carrier: true,
        trackingNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Optionally attach a tracking event.
  if (eventDescription || eventLocation) {
    await client.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        createdById: adminId ?? null,
        status: shipment.status,
        description: eventDescription ?? null,
        location: eventLocation ?? null,
      },
    });
  }

  return shipment;
}

export async function addShipmentTrackingEvent(
  orderId,
  adminId,
  { description, location, shipmentStatus } = {},
  client = prisma,
) {
  const shipment = await client.shipment.findUnique({
    where: { orderId },
    select: { id: true, status: true },
  });
  if (!shipment) {
    const err = new Error(
      'No shipment found for this order. Create a shipment first.',
    );
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const resolvedStatus = shipmentStatus || shipment.status;

  if (shipmentStatus && shipmentStatus !== shipment.status) {
    await client.shipment.update({
      where: { id: shipment.id },
      data: { status: resolvedStatus },
    });
  }

  const event = await client.shipmentEvent.create({
    data: {
      shipmentId: shipment.id,
      createdById: adminId ?? null,
      status: resolvedStatus,
      description: description ?? null,
      location: location ?? null,
    },
    select: {
      id: true,
      shipmentId: true,
      status: true,
      description: true,
      location: true,
      occurredAt: true,
    },
  });

  return event;
}

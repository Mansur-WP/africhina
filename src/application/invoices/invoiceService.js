import { prisma } from '../../../lib/prisma.js';

function notFound(message = 'Invoice not found.') {
  const error = new Error(message);
  error.code = 'NOT_FOUND';
  error.status = 404;
  return error;
}

function forbidden(message = 'Access denied.') {
  const error = new Error(message);
  error.code = 'FORBIDDEN';
  error.status = 403;
  return error;
}

export function toPublicInvoice(invoice) {
  const order = invoice.order || {};
  const verifiedPayment = order.payments?.find(
    (p) => p.status === 'VERIFIED' || p.status === 'success',
  );

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    orderId: invoice.orderId,
    orderNumber: order.orderNumber,
    createdAt:
      invoice.createdAt?.toISOString?.() ??
      new Date(invoice.createdAt).toISOString(),
    status: order.status,
    currency: order.currency,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress ?? null,
    buyer: order.buyer
      ? {
          id: order.buyer.id,
          name: order.buyer.name ?? null,
          email: order.buyer.email ?? null,
          phone: order.buyer.phone ?? null,
        }
      : null,
    payment: verifiedPayment
      ? {
          id: verifiedPayment.id,
          provider: verifiedPayment.provider,
          providerRef: verifiedPayment.providerRef ?? null,
          amount: verifiedPayment.amount,
          currency: verifiedPayment.currency,
          status: verifiedPayment.status,
          verifiedAt: verifiedPayment.verifiedAt?.toISOString?.() ?? null,
        }
      : null,
    items: (order.items ?? []).map((item) => ({
      id: item.id,
      productId: item.productId,
      productTitle: item.productTitle || item.product?.title || 'Order item',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currency: item.currency || order.currency,
      subtotal: item.subtotal,
    })),
  };
}

export async function getOrderInvoice(
  orderId,
  requester,
  { client = prisma } = {},
) {
  if (!requester) {
    const error = new Error('Authentication required.');
    error.code = 'UNAUTHORIZED';
    error.status = 401;
    throw error;
  }

  const invoice = await client.invoice.findFirst({
    where: { orderId },
    include: {
      order: {
        include: {
          buyer: { select: { id: true, name: true, email: true, phone: true } },
          items: {
            orderBy: { id: 'asc' },
            select: {
              id: true,
              productId: true,
              productTitle: true,
              quantity: true,
              unitPrice: true,
              currency: true,
              subtotal: true,
            },
          },
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
        },
      },
    },
  });

  if (!invoice || !invoice.order) {
    throw notFound();
  }

  const isAdmin = requester.role?.code === 'admin';
  const isOwner = invoice.order.buyerId === requester.id;

  if (!isAdmin && !isOwner) {
    // Avoid leaking invoice existence to unauthorized buyers
    throw notFound();
  }

  return toPublicInvoice(invoice);
}

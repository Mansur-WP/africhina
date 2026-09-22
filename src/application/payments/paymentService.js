import { prisma } from '../../../lib/prisma.js';
import crypto from 'crypto';
import { appUrl } from '../../infrastructure/config/env.js';
import * as paystackGateway from '../../infrastructure/payments/paystackGateway.js';
import { createNotification } from '../notifications/notificationService.js';
import {
  assertPaystackCurrency,
  assertMoneyMatchesOrder,
  assertPaystackProvider,
  assertPaymentTransition,
  assertProviderConfirmation,
  assertValidIdempotencyKey,
  PAYMENT_PROVIDER,
  PAYMENT_STATUSES,
} from '../../domain/payments/paymentRules.js';

function notFound(message = 'Order not found.') {
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

function conflict(message) {
  const error = new Error(message);
  error.code = 'CONFLICT';
  error.status = 409;
  return error;
}

function paymentSelect() {
  return {
    id: true,
    orderId: true,
    provider: true,
    providerRef: true,
    authorizationUrl: true,
    idempotencyKey: true,
    providerEventId: true,
    amount: true,
    currency: true,
    status: true,
    verificationResult: true,
    verifiedAt: true,
    failedAt: true,
    createdAt: true,
    updatedAt: true,
  };
}

function toPublicPayment(payment) {
  return {
    id: payment.id,
    orderId: payment.orderId,
    provider: payment.provider,
    providerReference: payment.providerRef,
    authorizationUrl: payment.authorizationUrl,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    verifiedAt: payment.verifiedAt?.toISOString() ?? null,
    failedAt: payment.failedAt?.toISOString() ?? null,
  };
}

function paymentReference() {
  return `AC-P-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
}

async function getOwnedPayableOrder(tx, buyerId, orderId) {
  const order = await tx.order.findFirst({
    where: { id: orderId, buyerId },
    select: {
      id: true,
      buyerId: true,
      status: true,
      totalAmount: true,
      currency: true,
      purchaseMode: true,
      stockReservationStatus: true,
      buyer: { select: { email: true } },
    },
  });
  if (!order) throw notFound();
  if (order.buyerId !== buyerId) throw forbidden();
  if (order.status !== 'pending_payment') {
    throw conflict('Only orders pending payment can create a payment attempt.');
  }
  if (
    order.purchaseMode === 'DIRECT_SALE' &&
    order.stockReservationStatus !== 'ACTIVE'
  ) {
    throw conflict('This order no longer has an active stock reservation.');
  }
  assertPaystackCurrency(order.currency);
  return order;
}

export async function createPaymentAttempt(
  buyerId,
  orderId,
  idempotencyKey,
  client = prisma,
) {
  assertPaystackProvider(PAYMENT_PROVIDER);
  assertValidIdempotencyKey(idempotencyKey);

  return client.$transaction(
    async (tx) => {
      const order = await getOwnedPayableOrder(tx, buyerId, orderId);
      const existing = await tx.payment.findUnique({
        where: {
          orderId_idempotencyKey: {
            orderId,
            idempotencyKey: idempotencyKey.trim(),
          },
        },
        select: paymentSelect(),
      });
      if (existing) return toPublicPayment(existing);

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: PAYMENT_PROVIDER,
          providerRef: paymentReference(),
          amount: order.totalAmount,
          currency: order.currency,
          status: PAYMENT_STATUSES.INITIATED,
          idempotencyKey: idempotencyKey.trim(),
        },
        select: paymentSelect(),
      });
      return toPublicPayment(payment);
    },
    { maxWait: 15000, timeout: 30000 },
  );
}

export async function initializePaystackPayment(
  buyerId,
  orderId,
  idempotencyKey,
  { gateway = paystackGateway, client = prisma } = {},
) {
  assertPaystackProvider(PAYMENT_PROVIDER);
  assertValidIdempotencyKey(idempotencyKey);

  const prepared = await client.$transaction(
    async (tx) => {
      const order = await getOwnedPayableOrder(tx, buyerId, orderId);
      const key = idempotencyKey.trim();
      const existing = await tx.payment.findUnique({
        where: { orderId_idempotencyKey: { orderId, idempotencyKey: key } },
        select: {
          ...paymentSelect(),
          order: { select: { buyer: { select: { email: true } } } },
        },
      });
      if (existing) {
        if (existing.status === PAYMENT_STATUSES.FAILED) {
          throw conflict(
            'This payment attempt failed. Use a new idempotency key to retry.',
          );
        }
        if (!existing.providerRef) {
          const updated = await tx.payment.update({
            where: { id: existing.id },
            data: { providerRef: paymentReference() },
            select: paymentSelect(),
          });
          return { payment: updated, reused: true, email: order.buyer.email };
        }
        return { payment: existing, reused: true, email: order.buyer.email };
      }

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: PAYMENT_PROVIDER,
          providerRef: paymentReference(),
          amount: order.totalAmount,
          currency: order.currency,
          status: PAYMENT_STATUSES.INITIATED,
          idempotencyKey: key,
        },
        select: paymentSelect(),
      });
      return { payment, reused: false, email: order.buyer.email };
    },
    { maxWait: 15000, timeout: 30000 },
  );

  if (
    prepared.payment.status === PAYMENT_STATUSES.PENDING_PROVIDER &&
    prepared.payment.providerRef &&
    prepared.payment.authorizationUrl
  ) {
    return toPublicPayment(prepared.payment);
  }

  if (prepared.reused && prepared.payment.providerRef) {
    throw conflict(
      'Payment initialization is already in progress. Retry shortly.',
    );
  }

  let providerResult;
  try {
    providerResult = await gateway.initializePayment({
      reference: prepared.payment.providerRef,
      amount: prepared.payment.amount,
      currency: prepared.payment.currency,
      email: prepared.email,
      callbackUrl: `${appUrl}/orders/${orderId}/payment/callback`,
      metadata: { orderId, paymentId: prepared.payment.id },
    });
  } catch (error) {
    if (error?.code === 'PAYMENT_PROVIDER_ERROR') {
      await client.payment.updateMany({
        where: {
          id: prepared.payment.id,
          status: PAYMENT_STATUSES.INITIATED,
        },
        data: { status: PAYMENT_STATUSES.FAILED, failedAt: new Date() },
      });
      throw error;
    }
    throw Object.assign(
      new Error('Payment provider is temporarily unavailable.'),
      {
        code: 'PAYMENT_PROVIDER_UNAVAILABLE',
        status: 503,
      },
    );
  }

  const updated = await client.payment.updateMany({
    where: {
      id: prepared.payment.id,
      status: PAYMENT_STATUSES.INITIATED,
      providerRef: prepared.payment.providerRef,
    },
    data: {
      providerRef: providerResult.reference,
      authorizationUrl: providerResult.authorizationUrl,
      status: PAYMENT_STATUSES.PENDING_PROVIDER,
    },
  });
  if (updated.count !== 1) {
    const current = await client.payment.findUnique({
      where: { id: prepared.payment.id },
      select: paymentSelect(),
    });
    if (current?.status === PAYMENT_STATUSES.PENDING_PROVIDER) {
      return toPublicPayment(current);
    }
    throw conflict('Payment initialization state changed. Retry safely.');
  }

  return toPublicPayment({
    ...prepared.payment,
    providerRef: providerResult.reference,
    authorizationUrl: providerResult.authorizationUrl,
    status: PAYMENT_STATUSES.PENDING_PROVIDER,
  });
}

export async function markPaymentPending(paymentId, client = prisma) {
  const payment = await client.payment.findUnique({
    where: { id: paymentId },
    select: paymentSelect(),
  });
  if (!payment) throw notFound('Payment attempt not found.');
  if (payment.status === PAYMENT_STATUSES.PENDING_PROVIDER) {
    return toPublicPayment(payment);
  }
  assertPaymentTransition(payment.status, PAYMENT_STATUSES.PENDING_PROVIDER);
  const updated = await client.payment.update({
    where: { id: paymentId, status: PAYMENT_STATUSES.INITIATED },
    data: { status: PAYMENT_STATUSES.PENDING_PROVIDER },
    select: paymentSelect(),
  });
  return toPublicPayment(updated);
}

export async function markPaymentVerified(
  paymentId,
  confirmation,
  client = prisma,
) {
  assertProviderConfirmation(confirmation);
  const payment = await client.payment.findUnique({
    where: { id: paymentId },
    select: {
      ...paymentSelect(),
      order: { select: { totalAmount: true, currency: true } },
    },
  });
  if (!payment) throw notFound('Payment attempt not found.');
  if (payment.status === PAYMENT_STATUSES.VERIFIED)
    return toPublicPayment(payment);
  assertPaymentTransition(payment.status, PAYMENT_STATUSES.VERIFIED);
  assertMoneyMatchesOrder(payment, payment.order);
  if (
    confirmation.amount !== payment.amount ||
    confirmation.currency !== payment.currency
  ) {
    throw conflict('Provider payment does not match the order.');
  }
  const updated = await client.payment.update({
    where: { id: paymentId, status: PAYMENT_STATUSES.PENDING_PROVIDER },
    data: {
      status: PAYMENT_STATUSES.VERIFIED,
      providerRef: confirmation.providerReference,
      providerEventId: confirmation.providerEventId,
      verificationResult: confirmation.result ?? undefined,
      verifiedAt: new Date(),
    },
    select: paymentSelect(),
  });
  return toPublicPayment(updated);
}

export async function markPaymentFailed(paymentId, client = prisma) {
  const payment = await client.payment.findUnique({
    where: { id: paymentId },
    select: paymentSelect(),
  });
  if (!payment) throw notFound('Payment attempt not found.');
  if (payment.status === PAYMENT_STATUSES.FAILED)
    return toPublicPayment(payment);
  assertPaymentTransition(payment.status, PAYMENT_STATUSES.FAILED);
  const updated = await client.payment.update({
    where: { id: paymentId, status: PAYMENT_STATUSES.PENDING_PROVIDER },
    data: { status: PAYMENT_STATUSES.FAILED, failedAt: new Date() },
    select: paymentSelect(),
  });
  return toPublicPayment(updated);
}

export async function settlePaystackPayment(
  {
    paymentId,
    providerRef,
    providerEventId,
    amount,
    currency,
    providerStatus,
    verificationResult,
    webhookPayload,
    source = 'verify',
  } = {},
  { client = prisma, notify = createNotification } = {},
) {
  assertPaystackProvider(PAYMENT_PROVIDER);

  let payment;
  if (paymentId) {
    payment = await client.payment.findUnique({
      where: { id: paymentId },
      select: {
        ...paymentSelect(),
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            buyerId: true,
            purchaseMode: true,
            stockReservationStatus: true,
            totalAmount: true,
            currency: true,
          },
        },
      },
    });
  } else if (providerRef) {
    payment = await client.payment.findUnique({
      where: { providerRef },
      select: {
        ...paymentSelect(),
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            buyerId: true,
            purchaseMode: true,
            stockReservationStatus: true,
            totalAmount: true,
            currency: true,
          },
        },
      },
    });
  }

  if (!payment) {
    throw notFound('Payment attempt not found.');
  }

  if (payment.status === PAYMENT_STATUSES.VERIFIED) {
    return {
      payment: toPublicPayment(payment),
      order: payment.order,
      alreadyVerified: true,
      settledNow: false,
    };
  }

  if (providerStatus !== 'success') {
    if (
      payment.status === PAYMENT_STATUSES.INITIATED ||
      payment.status === PAYMENT_STATUSES.PENDING_PROVIDER
    ) {
      const updated = await client.payment.update({
        where: { id: payment.id },
        data: {
          status: PAYMENT_STATUSES.FAILED,
          failedAt: new Date(),
          verificationResult: verificationResult ?? undefined,
          webhookPayload: webhookPayload ?? undefined,
        },
        select: paymentSelect(),
      });
      return {
        payment: toPublicPayment(updated),
        order: payment.order,
        alreadyVerified: false,
        settledNow: false,
        status: PAYMENT_STATUSES.FAILED,
      };
    }
    return {
      payment: toPublicPayment(payment),
      order: payment.order,
      alreadyVerified: false,
      settledNow: false,
      status: payment.status,
    };
  }

  assertPaymentTransition(payment.status, PAYMENT_STATUSES.VERIFIED);
  assertMoneyMatchesOrder(payment, payment.order);

  if (amount !== payment.amount || currency !== payment.currency) {
    throw conflict(
      'Provider payment amount or currency does not match the order.',
    );
  }

  if (
    providerRef &&
    payment.providerRef &&
    providerRef !== payment.providerRef
  ) {
    throw conflict(
      'Provider payment reference does not match the payment attempt.',
    );
  }

  const settlement = await client.$transaction(
    async (tx) => {
      const freshPayment = await tx.payment.findUnique({
        where: { id: payment.id },
        select: {
          ...paymentSelect(),
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              buyerId: true,
              purchaseMode: true,
              stockReservationStatus: true,
              totalAmount: true,
              currency: true,
            },
          },
        },
      });

      if (!freshPayment) throw notFound('Payment attempt not found.');
      if (freshPayment.status === PAYMENT_STATUSES.VERIFIED) {
        return {
          payment: freshPayment,
          order: freshPayment.order,
          alreadyVerified: true,
          settledNow: false,
        };
      }

      if (freshPayment.order.status === 'cancelled') {
        throw conflict('Cannot settle payment for a cancelled order.');
      }

      if (
        freshPayment.order.purchaseMode === 'DIRECT_SALE' &&
        freshPayment.order.stockReservationStatus === 'RELEASED'
      ) {
        throw conflict(
          'Cannot settle payment for an order with released stock.',
        );
      }

      const updatedPayment = await tx.payment.update({
        where: { id: freshPayment.id },
        data: {
          status: PAYMENT_STATUSES.VERIFIED,
          providerRef: providerRef || freshPayment.providerRef,
          providerEventId: providerEventId
            ? String(providerEventId)
            : freshPayment.providerEventId,
          verificationResult: verificationResult ?? undefined,
          webhookPayload: webhookPayload ?? undefined,
          verifiedAt: new Date(),
        },
        select: paymentSelect(),
      });

      const orderUpdateData = {};
      if (
        freshPayment.order.status === 'pending_payment' ||
        freshPayment.order.status === 'draft'
      ) {
        orderUpdateData.status = 'paid';
      }

      if (
        freshPayment.order.purchaseMode === 'DIRECT_SALE' &&
        freshPayment.order.stockReservationStatus === 'ACTIVE'
      ) {
        orderUpdateData.stockReservationStatus = 'COMMITTED';
        orderUpdateData.stockReservationCommittedAt = new Date();
      }

      let updatedOrder = freshPayment.order;
      if (Object.keys(orderUpdateData).length > 0) {
        updatedOrder = await tx.order.update({
          where: { id: freshPayment.order.id },
          data: orderUpdateData,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            buyerId: true,
            purchaseMode: true,
            stockReservationStatus: true,
            totalAmount: true,
            currency: true,
          },
        });
      }

      if (tx.invoice?.findFirst && tx.invoice?.create) {
        const existingInvoice = await tx.invoice.findFirst({
          where: { orderId: freshPayment.order.id },
        });
        if (!existingInvoice) {
          const year = new Date().getFullYear();
          const invoiceNumber = `INV-${year}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
          await tx.invoice.create({
            data: {
              orderId: freshPayment.order.id,
              paymentId: freshPayment.id,
              invoiceNumber,
            },
          });
        }
      }

      // Idempotently clean up purchased cart items for the customer's cart
      if (
        tx.orderItem?.findMany &&
        tx.cart?.findUnique &&
        tx.cartItem?.deleteMany
      ) {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: freshPayment.order.id },
          select: { productId: true },
        });
        const productIds = orderItems
          .map((item) => item.productId)
          .filter(Boolean);
        if (productIds.length > 0) {
          const userCart = await tx.cart.findUnique({
            where: { buyerId: freshPayment.order.buyerId },
            select: { id: true },
          });
          if (userCart) {
            await tx.cartItem.deleteMany({
              where: {
                cartId: userCart.id,
                productId: { in: productIds },
              },
            });
          }
        }
      }

      return {
        payment: updatedPayment,
        order: updatedOrder,
        alreadyVerified: false,
        settledNow: true,
      };
    },
    { maxWait: 15000, timeout: 30000 },
  );

  if (settlement.settledNow && notify) {
    try {
      await notify({
        userId: settlement.order.buyerId,
        type: 'order',
        title: 'Payment Confirmed',
        body: `Payment for Order ${settlement.order.orderNumber} has been verified successfully.`,
      });
      if (client.user?.findMany) {
        const admins = await client.user.findMany({
          where: { role: { code: 'admin' }, status: 'active', deletedAt: null },
          select: { id: true },
        });
        await Promise.all(
          admins.map((admin) =>
            notify({
              userId: admin.id,
              type: 'order',
              title: 'Payment Received',
              body: `Order ${settlement.order.orderNumber} has been paid.`,
            }),
          ),
        );
      }
    } catch {
      // Best-effort notification delivery
    }
  }

  return {
    payment: toPublicPayment(settlement.payment),
    order: settlement.order,
    alreadyVerified: settlement.alreadyVerified,
    settledNow: settlement.settledNow,
  };
}

export async function verifyAndSyncPayment(
  { buyerId, orderId, reference } = {},
  {
    gateway = paystackGateway,
    client = prisma,
    notify = createNotification,
  } = {},
) {
  if (!buyerId) throw forbidden();
  if (!orderId) {
    const error = new Error('Order ID is required.');
    error.code = 'VALIDATION_ERROR';
    error.status = 422;
    throw error;
  }

  const order = await client.order.findFirst({
    where: { id: orderId, buyerId },
    select: {
      id: true,
      buyerId: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      currency: true,
      purchaseMode: true,
      stockReservationStatus: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        select: paymentSelect(),
      },
    },
  });

  if (!order) throw notFound('Order not found.');
  if (order.buyerId !== buyerId) throw forbidden();

  let targetPayment = null;
  if (reference) {
    targetPayment = order.payments?.find((p) => p.providerRef === reference);
  }
  if (!targetPayment && order.payments?.length) {
    targetPayment =
      order.payments.find(
        (p) =>
          p.status === PAYMENT_STATUSES.VERIFIED ||
          p.status === PAYMENT_STATUSES.PENDING_PROVIDER ||
          p.status === PAYMENT_STATUSES.INITIATED,
      ) || order.payments[0];
  }

  if (!targetPayment) {
    throw notFound('No payment attempt found for this order.');
  }

  if (targetPayment.status === PAYMENT_STATUSES.VERIFIED) {
    return {
      payment: toPublicPayment(targetPayment),
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
      alreadyVerified: true,
    };
  }

  const refToVerify = reference || targetPayment.providerRef;
  if (!refToVerify) {
    throw conflict('Payment attempt has no provider reference to verify.');
  }

  const providerResult = await gateway.verifyPayment({
    reference: refToVerify,
  });

  return settlePaystackPayment(
    {
      paymentId: targetPayment.id,
      providerRef: providerResult.reference,
      providerEventId: providerResult.providerEventId,
      amount: providerResult.amount,
      currency: providerResult.currency,
      providerStatus: providerResult.status,
      verificationResult: providerResult.raw,
      source: 'verify',
    },
    { client, notify },
  );
}

export async function handlePaystackWebhook(
  { rawBody, signature, eventPayload } = {},
  {
    gateway = paystackGateway,
    client = prisma,
    notify = createNotification,
  } = {},
) {
  const isValid = gateway.verifyWebhookSignature({ rawBody, signature });
  if (!isValid) {
    const error = new Error('Invalid webhook signature.');
    error.code = 'UNAUTHORIZED';
    error.status = 401;
    throw error;
  }

  let payload = eventPayload;
  if (!payload && rawBody) {
    try {
      payload =
        typeof rawBody === 'string'
          ? JSON.parse(rawBody)
          : JSON.parse(rawBody.toString('utf8'));
    } catch {
      const error = new Error('Malformed webhook JSON payload.');
      error.code = 'VALIDATION_ERROR';
      error.status = 400;
      throw error;
    }
  }

  if (!payload || typeof payload !== 'object') {
    const error = new Error('Invalid webhook event payload.');
    error.code = 'VALIDATION_ERROR';
    error.status = 400;
    throw error;
  }

  const { event, data } = payload;

  if (event === 'charge.success') {
    if (!data || typeof data !== 'object') {
      const error = new Error('Missing charge.success event data.');
      error.code = 'VALIDATION_ERROR';
      error.status = 400;
      throw error;
    }

    const reference = data.reference;
    const metadata = data.metadata || {};
    const amount = data.amount;
    const currency = data.currency;
    const status = data.status;
    const providerEventId = data.id ? String(data.id) : null;

    let payment = null;
    if (reference) {
      payment = await client.payment.findUnique({
        where: { providerRef: reference },
        select: {
          ...paymentSelect(),
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              buyerId: true,
              purchaseMode: true,
              stockReservationStatus: true,
              totalAmount: true,
              currency: true,
            },
          },
        },
      });
    }

    if (!payment && metadata.paymentId) {
      payment = await client.payment.findUnique({
        where: { id: metadata.paymentId },
        select: {
          ...paymentSelect(),
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              buyerId: true,
              purchaseMode: true,
              stockReservationStatus: true,
              totalAmount: true,
              currency: true,
            },
          },
        },
      });
    }

    if (!payment && metadata.orderId) {
      payment = await client.payment.findFirst({
        where: { orderId: metadata.orderId },
        orderBy: { createdAt: 'desc' },
        select: {
          ...paymentSelect(),
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              buyerId: true,
              purchaseMode: true,
              stockReservationStatus: true,
              totalAmount: true,
              currency: true,
            },
          },
        },
      });
    }

    if (!payment) {
      const error = new Error(
        `Payment attempt not found for reference: ${reference || 'unknown'}`,
      );
      error.code = 'NOT_FOUND';
      error.status = 404;
      throw error;
    }

    return settlePaystackPayment(
      {
        paymentId: payment.id,
        providerRef: reference || payment.providerRef,
        providerEventId,
        amount,
        currency,
        providerStatus: status,
        verificationResult: data,
        webhookPayload: payload,
        source: 'webhook',
      },
      { client, notify },
    );
  }

  return {
    processed: true,
    ignored: true,
    event,
  };
}

export { forbidden, notFound, paymentSelect };

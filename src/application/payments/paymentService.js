import { prisma } from '../../../lib/prisma.js';
import crypto from 'crypto';
import { appUrl } from '../../infrastructure/config/env.js';
import * as paystackGateway from '../../infrastructure/payments/paystackGateway.js';
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

  return client.$transaction(async (tx) => {
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
  });
}

export async function initializePaystackPayment(
  buyerId,
  orderId,
  idempotencyKey,
  { gateway = paystackGateway, client = prisma } = {},
) {
  assertPaystackProvider(PAYMENT_PROVIDER);
  assertValidIdempotencyKey(idempotencyKey);

  const prepared = await client.$transaction(async (tx) => {
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
  });

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

export { forbidden, notFound, paymentSelect };

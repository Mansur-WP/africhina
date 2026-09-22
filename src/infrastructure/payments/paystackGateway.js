import crypto from 'crypto';
import { paystackApiUrl, paystackSecretKey } from '../config/env.js';

function notImplemented(operation) {
  const error = new Error(`Paystack ${operation} is not implemented yet.`);
  error.code = 'NOT_IMPLEMENTED';
  error.status = 501;
  return error;
}

export function getPaystackConfiguration() {
  return {
    configured: Boolean(paystackSecretKey),
  };
}

export async function initializePayment({
  reference,
  amount,
  currency,
  email,
  callbackUrl,
  metadata,
} = {}) {
  if (!paystackSecretKey) {
    const error = new Error('Payment provider is not configured.');
    error.code = 'PAYMENT_PROVIDER_UNAVAILABLE';
    error.status = 503;
    throw error;
  }
  if (
    !reference ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    currency !== 'NGN'
  ) {
    const error = new Error('Invalid payment initialization request.');
    error.code = 'PAYMENT_PROVIDER_ERROR';
    error.status = 502;
    throw error;
  }

  let response;
  try {
    response = await fetch(`${paystackApiUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        currency,
        reference,
        callback_url: callbackUrl,
        metadata,
      }),
    });
  } catch {
    const error = new Error('Payment provider is temporarily unavailable.');
    error.code = 'PAYMENT_PROVIDER_UNAVAILABLE';
    error.status = 503;
    throw error;
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    const error = new Error('Payment provider returned an invalid response.');
    error.code = 'PAYMENT_PROVIDER_ERROR';
    error.status = 502;
    throw error;
  }

  const providerData = payload?.data;
  if (
    !response.ok ||
    payload?.status !== true ||
    !providerData?.authorization_url ||
    !providerData?.reference
  ) {
    const rawMsg =
      typeof payload?.message === 'string' ? payload.message.trim() : '';
    const safeMsg =
      rawMsg && (!paystackSecretKey || !rawMsg.includes(paystackSecretKey))
        ? `: ${rawMsg}`
        : '.';
    const error = new Error(
      `Payment provider rejected initialization${safeMsg}`,
    );
    error.code = 'PAYMENT_PROVIDER_ERROR';
    error.status = 502;
    throw error;
  }

  return {
    reference: providerData.reference,
    authorizationUrl: providerData.authorization_url,
  };
}

export async function verifyPayment({ reference } = {}) {
  if (!paystackSecretKey) {
    const error = new Error('Payment provider is not configured.');
    error.code = 'PAYMENT_PROVIDER_UNAVAILABLE';
    error.status = 503;
    throw error;
  }
  if (!reference || typeof reference !== 'string') {
    const error = new Error(
      'A valid payment reference is required for verification.',
    );
    error.code = 'VALIDATION_ERROR';
    error.status = 422;
    throw error;
  }

  let response;
  try {
    response = await fetch(
      `${paystackApiUrl}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch {
    const error = new Error('Payment provider is temporarily unavailable.');
    error.code = 'PAYMENT_PROVIDER_UNAVAILABLE';
    error.status = 503;
    throw error;
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    const error = new Error('Payment provider returned an invalid response.');
    error.code = 'PAYMENT_PROVIDER_ERROR';
    error.status = 502;
    throw error;
  }

  const providerData = payload?.data;
  if (!response.ok || payload?.status !== true || !providerData) {
    const error = new Error('Payment provider rejected verification request.');
    error.code = 'PAYMENT_PROVIDER_ERROR';
    error.status = 502;
    throw error;
  }

  return {
    status: providerData.status,
    reference: providerData.reference,
    amount: providerData.amount,
    currency: providerData.currency,
    providerEventId: providerData.id ? String(providerData.id) : null,
    paidAt: providerData.paid_at ? new Date(providerData.paid_at) : null,
    gatewayResponse: providerData.gateway_response || null,
    channel: providerData.channel || null,
    metadata: providerData.metadata || null,
    raw: providerData,
  };
}

export function verifyWebhookSignature({ rawBody, signature } = {}) {
  if (!paystackSecretKey) {
    return false;
  }
  if (
    !signature ||
    typeof signature !== 'string' ||
    (typeof rawBody !== 'string' && !Buffer.isBuffer(rawBody))
  ) {
    return false;
  }

  try {
    const computedHash = crypto
      .createHmac('sha512', paystackSecretKey)
      .update(rawBody)
      .digest('hex');

    const hashBuffer = Buffer.from(computedHash, 'utf8');
    const sigBuffer = Buffer.from(signature.trim(), 'utf8');

    if (hashBuffer.length !== sigBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(hashBuffer, sigBuffer);
  } catch {
    return false;
  }
}

export async function refundPayment() {
  throw notImplemented('refunds');
}

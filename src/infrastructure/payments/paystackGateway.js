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
    const error = new Error('Payment provider rejected initialization.');
    error.code = 'PAYMENT_PROVIDER_ERROR';
    error.status = 502;
    throw error;
  }

  return {
    reference: providerData.reference,
    authorizationUrl: providerData.authorization_url,
  };
}

export async function verifyPayment() {
  throw notImplemented('verification');
}

export function verifyWebhookSignature() {
  throw notImplemented('webhook verification');
}

export async function refundPayment() {
  throw notImplemented('refunds');
}

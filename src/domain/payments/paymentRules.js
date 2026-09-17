export const PAYMENT_PROVIDER = 'paystack';
export const PAYSTACK_SUPPORTED_CURRENCIES = Object.freeze(['NGN']);

export const PAYMENT_STATUSES = Object.freeze({
  INITIATED: 'INITIATED',
  PENDING_PROVIDER: 'PENDING_PROVIDER',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

const ALLOWED_TRANSITIONS = new Map([
  [PAYMENT_STATUSES.INITIATED, new Set([PAYMENT_STATUSES.PENDING_PROVIDER])],
  [
    PAYMENT_STATUSES.PENDING_PROVIDER,
    new Set([PAYMENT_STATUSES.VERIFIED, PAYMENT_STATUSES.FAILED]),
  ],
  [PAYMENT_STATUSES.VERIFIED, new Set([PAYMENT_STATUSES.REFUNDED])],
  [PAYMENT_STATUSES.FAILED, new Set()],
  [PAYMENT_STATUSES.REFUNDED, new Set()],
]);

function paymentError(message, code = 'CONFLICT', status = 409) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

export function assertPaystackProvider(provider) {
  if (provider !== PAYMENT_PROVIDER) {
    throw paymentError(
      'Only Paystack payments are supported.',
      'VALIDATION_ERROR',
      422,
    );
  }
}

export function assertPaystackCurrency(currency) {
  if (!PAYSTACK_SUPPORTED_CURRENCIES.includes(currency)) {
    throw paymentError(
      'This currency is not supported for Paystack payments.',
      'VALIDATION_ERROR',
      422,
    );
  }
}

export function assertValidIdempotencyKey(idempotencyKey) {
  if (
    typeof idempotencyKey !== 'string' ||
    idempotencyKey.trim().length < 8 ||
    idempotencyKey.trim().length > 200
  ) {
    throw paymentError(
      'A valid payment idempotency key is required.',
      'VALIDATION_ERROR',
      422,
    );
  }
}

export function assertMoneyMatchesOrder(payment, order) {
  if (payment.amount !== order.totalAmount) {
    throw paymentError(
      'Payment amount does not match the order.',
      'CONFLICT',
      409,
    );
  }
  if (payment.currency !== order.currency) {
    throw paymentError(
      'Payment currency does not match the order.',
      'CONFLICT',
      409,
    );
  }
}

export function canTransitionPayment(from, to) {
  return ALLOWED_TRANSITIONS.get(from)?.has(to) ?? false;
}

export function assertPaymentTransition(from, to) {
  if (!canTransitionPayment(from, to)) {
    throw paymentError(`Payment cannot transition from ${from} to ${to}.`);
  }
}

export function assertProviderConfirmation(confirmation = {}) {
  if (confirmation.confirmed !== true) {
    throw paymentError(
      'Payment cannot be verified without provider confirmation.',
      'CONFLICT',
      409,
    );
  }
  if (!confirmation.providerReference || !confirmation.providerEventId) {
    throw paymentError(
      'Provider reference and event identity are required for verification.',
      'VALIDATION_ERROR',
      422,
    );
  }
}

export function paymentTransitionTable() {
  return [...ALLOWED_TRANSITIONS.entries()].map(([from, to]) => ({
    from,
    to: [...to],
  }));
}

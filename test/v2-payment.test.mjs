import assert from 'node:assert';
import crypto from 'node:crypto';
import { describe, it } from 'node:test';
import {
  assertMoneyMatchesOrder,
  assertPaystackCurrency,
  assertPaystackProvider,
  assertPaymentTransition,
  assertProviderConfirmation,
  assertValidIdempotencyKey,
  canTransitionPayment,
  PAYMENT_PROVIDER,
  PAYMENT_STATUSES,
} from '../src/domain/payments/paymentRules.js';
import {
  createPaymentAttempt,
  initializePaystackPayment,
  markPaymentVerified,
  settlePaystackPayment,
  verifyAndSyncPayment,
  handlePaystackWebhook,
} from '../src/application/payments/paymentService.js';
import {
  initializePayment,
  verifyWebhookSignature,
} from '../src/infrastructure/payments/paystackGateway.js';
import { getAuthorizationPolicy } from '../src/shared/lib/authorization.js';

const order = {
  id: 'order-1',
  buyerId: 'buyer-1',
  status: 'pending_payment',
  totalAmount: 125000,
  currency: 'NGN',
};

function payment(overrides = {}) {
  return {
    id: 'payment-1',
    orderId: order.id,
    provider: PAYMENT_PROVIDER,
    providerRef: null,
    idempotencyKey: 'payment-key-1',
    providerEventId: null,
    amount: order.totalAmount,
    currency: order.currency,
    status: PAYMENT_STATUSES.INITIATED,
    verificationResult: null,
    verifiedAt: null,
    failedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function paymentClient({ existing = null, created = payment() } = {}) {
  const calls = [];
  const tx = {
    order: {
      findFirst: async ({ where }) => {
        calls.push(['order.findFirst', where]);
        return where.buyerId === order.buyerId ? order : null;
      },
    },
    payment: {
      findUnique: async ({ where }) => {
        calls.push(['payment.findUnique', where]);
        return existing;
      },
      create: async ({ data }) => {
        calls.push(['payment.create', data]);
        return { ...created, ...data };
      },
    },
  };
  return {
    calls,
    $transaction: async (callback) => callback(tx),
  };
}

describe('V2 payment domain rules', () => {
  it('uses Paystack and rejects unsupported providers', () => {
    assertPaystackProvider('paystack');
    assert.throws(
      () => assertPaystackProvider('flutterwave'),
      (error) => error.code === 'VALIDATION_ERROR',
    );
    assert.doesNotThrow(() => assertPaystackCurrency('NGN'));
    assert.throws(
      () => assertPaystackCurrency('USD'),
      (error) => error.code === 'VALIDATION_ERROR',
    );
  });

  it('allows only the minimal payment lifecycle transitions', () => {
    assert.equal(
      canTransitionPayment(
        PAYMENT_STATUSES.INITIATED,
        PAYMENT_STATUSES.PENDING_PROVIDER,
      ),
      true,
    );
    assert.equal(
      canTransitionPayment(
        PAYMENT_STATUSES.FAILED,
        PAYMENT_STATUSES.PENDING_PROVIDER,
      ),
      false,
    );
    assert.throws(() => assertPaymentTransition('FAILED', 'VERIFIED'));
  });

  it('requires and scopes idempotency keys', () => {
    assert.doesNotThrow(() => assertValidIdempotencyKey('payment-key-1'));
    assert.throws(() => assertValidIdempotencyKey('short'));
  });

  it('protects payment initialization for buyers only', () => {
    assert.deepEqual(getAuthorizationPolicy('/api/v1/payments/initialize'), {
      type: 'api',
      authRequired: true,
      allowRoles: ['buyer'],
    });
  });

  it('requires exact server-side amount and currency matches', () => {
    assert.doesNotThrow(() => assertMoneyMatchesOrder(payment(), order));
    assert.throws(
      () => assertMoneyMatchesOrder(payment({ amount: 1 }), order),
      (error) => error.code === 'CONFLICT',
    );
    assert.throws(
      () => assertMoneyMatchesOrder(payment({ currency: 'USD' }), order),
      (error) => error.code === 'CONFLICT',
    );
  });

  it('creates an attempt from the Order snapshot and ignores client money input', async () => {
    const client = paymentClient();
    const result = await createPaymentAttempt(
      order.buyerId,
      order.id,
      'payment-key-1',
      client,
      { amount: 1, currency: 'USD' },
    );
    const createCall = client.calls.find(([name]) => name === 'payment.create');
    assert.equal(result.amount, order.totalAmount);
    assert.equal(result.currency, order.currency);
    assert.equal(createCall[1].amount, order.totalAmount);
    assert.equal(createCall[1].currency, order.currency);
    assert.equal(createCall[1].provider, 'paystack');
    assert.equal(createCall[1].status, 'INITIATED');
  });

  it('enforces buyer ownership before creating or returning an attempt', async () => {
    const client = paymentClient();
    await assert.rejects(
      () =>
        createPaymentAttempt('other-buyer', order.id, 'payment-key-1', client),
      (error) => error.code === 'NOT_FOUND',
    );
    assert.equal(
      client.calls.some(([name]) => name === 'payment.create'),
      false,
    );
  });

  it('returns the existing attempt for a repeated idempotency key', async () => {
    const existing = payment({ status: PAYMENT_STATUSES.PENDING_PROVIDER });
    const client = paymentClient({ existing });
    const result = await createPaymentAttempt(
      order.buyerId,
      order.id,
      'payment-key-1',
      client,
    );
    assert.equal(result.id, existing.id);
    assert.equal(
      client.calls.some(([name]) => name === 'payment.create'),
      false,
    );
  });

  it('permits a new attempt after a failed attempt when the key changes', async () => {
    const client = paymentClient({ created: payment({ id: 'payment-2' }) });
    const result = await createPaymentAttempt(
      order.buyerId,
      order.id,
      'payment-key-2',
      client,
    );
    assert.equal(result.id, 'payment-2');
    const createCall = client.calls.find(([name]) => name === 'payment.create');
    assert.equal(createCall[1].idempotencyKey, 'payment-key-2');
  });

  it('does not verify without authoritative provider confirmation', async () => {
    await assert.rejects(
      () => markPaymentVerified('payment-1', { confirmed: false }),
      (error) => error.code === 'CONFLICT',
    );
    assert.throws(
      () => assertProviderConfirmation({ confirmed: true }),
      (error) => error.code === 'VALIDATION_ERROR',
    );
  });

  it('does not expose secret key in gateway error messages', async () => {
    // Calling initializePayment() with no arguments must always throw without
    // leaking the raw PAYSTACK_SECRET_KEY value.
    // If the key is not set it throws PAYMENT_PROVIDER_UNAVAILABLE (503).
    // If the key is set but arguments are invalid it throws PAYMENT_PROVIDER_ERROR (502).
    // Either way, the secret key must not appear in the message.
    const secretKey = process.env.PAYSTACK_SECRET_KEY ?? 'PAYSTACK_SECRET_KEY';
    await assert.rejects(
      () => initializePayment(),
      (error) =>
        (error.code === 'PAYMENT_PROVIDER_UNAVAILABLE' ||
          error.code === 'PAYMENT_PROVIDER_ERROR') &&
        !error.message.includes(secretKey),
    );
  });

  it('initializes Paystack from server-side Order and buyer data', async () => {
    const calls = [];
    const paymentRecord = payment({
      providerRef: 'AC-P-INITIAL-REFERENCE',
      authorizationUrl: null,
    });
    const client = {
      $transaction: async (callback) =>
        callback({
          order: {
            findFirst: async () => ({
              ...order,
              purchaseMode: 'DIRECT_SALE',
              stockReservationStatus: 'ACTIVE',
              buyer: { email: 'buyer@example.com' },
            }),
          },
          payment: {
            findUnique: async () => null,
            create: async ({ data }) => ({ ...paymentRecord, ...data }),
          },
        }),
      payment: {
        updateMany: async ({ data }) => {
          calls.push(data);
          return { count: 1 };
        },
      },
    };
    const gateway = {
      initializePayment: async (request) => {
        calls.push(request);
        return {
          reference: request.reference,
          authorizationUrl: 'https://checkout.paystack.com/authorization',
        };
      },
    };

    const result = await initializePaystackPayment(
      order.buyerId,
      order.id,
      'payment-key-1',
      { client, gateway },
    );
    const providerRequest = calls.find((call) => call.email);
    assert.equal(providerRequest.amount, order.totalAmount);
    assert.equal(providerRequest.currency, order.currency);
    assert.equal(providerRequest.email, 'buyer@example.com');
    assert.equal(result.status, 'PENDING_PROVIDER');
    assert.equal(
      result.authorizationUrl,
      'https://checkout.paystack.com/authorization',
    );
    assert.match(result.providerReference, /^AC-P-/);
  });

  it('reuses an initialized pending attempt without another provider call', async () => {
    let providerCalls = 0;
    const existing = payment({
      status: PAYMENT_STATUSES.PENDING_PROVIDER,
      providerRef: 'AC-P-EXISTING',
      authorizationUrl: 'https://checkout.paystack.com/existing',
    });
    const client = paymentClient({ existing });
    client.$transaction = async (callback) =>
      callback({
        order: {
          findFirst: async () => ({
            ...order,
            purchaseMode: 'DIRECT_SALE',
            stockReservationStatus: 'ACTIVE',
            buyer: { email: 'buyer@example.com' },
          }),
        },
        payment: { findUnique: async () => existing },
      });
    const result = await initializePaystackPayment(
      order.buyerId,
      order.id,
      'payment-key-1',
      {
        client,
        gateway: {
          initializePayment: async () => {
            providerCalls += 1;
          },
        },
      },
    );
    assert.equal(providerCalls, 0);
    assert.equal(result.authorizationUrl, existing.authorizationUrl);
  });

  it('does not mark payment pending or mutate stock when provider initialization fails', async () => {
    let updateCalls = 0;
    const client = {
      $transaction: async (callback) =>
        callback({
          order: {
            findFirst: async () => ({
              ...order,
              purchaseMode: 'DIRECT_SALE',
              stockReservationStatus: 'ACTIVE',
              buyer: { email: 'buyer@example.com' },
            }),
          },
          payment: {
            findUnique: async () => null,
            create: async ({ data }) => payment({ ...data }),
          },
        }),
      payment: {
        updateMany: async () => {
          updateCalls += 1;
          return { count: 1 };
        },
      },
    };
    await assert.rejects(
      () =>
        initializePaystackPayment(order.buyerId, order.id, 'payment-key-1', {
          client,
          gateway: {
            initializePayment: async () => {
              throw Object.assign(new Error('provider down'), {
                code: 'PAYMENT_PROVIDER_UNAVAILABLE',
              });
            },
          },
        }),
      (error) => error.code === 'PAYMENT_PROVIDER_UNAVAILABLE',
    );
    assert.equal(updateCalls, 0);
  });

  it('records a provider rejection as FAILED without changing the Order', async () => {
    let paymentUpdate;
    const client = {
      $transaction: async (callback) =>
        callback({
          order: {
            findFirst: async () => ({
              ...order,
              purchaseMode: 'DIRECT_SALE',
              stockReservationStatus: 'ACTIVE',
              buyer: { email: 'buyer@example.com' },
            }),
          },
          payment: {
            findUnique: async () => null,
            create: async ({ data }) => payment({ ...data }),
          },
        }),
      payment: {
        updateMany: async ({ data }) => {
          paymentUpdate = data;
          return { count: 1 };
        },
      },
    };
    await assert.rejects(
      () =>
        initializePaystackPayment(order.buyerId, order.id, 'payment-key-1', {
          client,
          gateway: {
            initializePayment: async () => {
              throw Object.assign(new Error('rejected'), {
                code: 'PAYMENT_PROVIDER_ERROR',
                status: 502,
              });
            },
          },
        }),
      (error) => error.code === 'PAYMENT_PROVIDER_ERROR',
    );
    assert.equal(paymentUpdate.status, PAYMENT_STATUSES.FAILED);
  });

  it('whitelists the webhook route as public and protects the verify endpoint', () => {
    assert.deepEqual(getAuthorizationPolicy('/api/v1/payments/webhook'), {
      type: 'public',
      authRequired: false,
      allowRoles: [],
    });
    assert.deepEqual(getAuthorizationPolicy('/api/v1/payments/verify'), {
      type: 'api',
      authRequired: true,
      allowRoles: ['buyer'],
    });
  });

  it('settles a successful Paystack payment, updates Order to paid, and commits stock for DIRECT_SALE exactly once', async () => {
    let committedStock = false;
    let orderStatus = 'pending_payment';
    let paymentStatus = PAYMENT_STATUSES.PENDING_PROVIDER;
    let invoiceCreated = null;
    let notifications = [];

    const orderRecord = {
      ...order,
      purchaseMode: 'DIRECT_SALE',
      stockReservationStatus: 'ACTIVE',
      buyer: { id: order.buyerId, email: 'buyer@example.com' },
    };
    const paymentRecord = payment({
      status: PAYMENT_STATUSES.PENDING_PROVIDER,
      providerRef: 'AC-P-TEST-REF',
    });

    const client = {
      payment: {
        findUnique: async () => ({
          ...paymentRecord,
          status: paymentStatus,
          order: orderRecord,
        }),
      },
      order: {
        findFirst: async () => ({
          ...orderRecord,
          status: orderStatus,
          payments: [{ ...paymentRecord, status: paymentStatus }],
        }),
      },
      user: {
        findMany: async () => [{ id: 'admin-1' }],
      },
      $transaction: async (callback) =>
        callback({
          payment: {
            findUnique: async () => ({
              ...paymentRecord,
              status: paymentStatus,
              order: orderRecord,
            }),
            update: async ({ data }) => {
              paymentStatus = data.status;
              return { ...paymentRecord, ...data };
            },
          },
          order: {
            update: async ({ data }) => {
              orderStatus = data.status;
              if (data.stockReservationStatus === 'COMMITTED') {
                committedStock = true;
              }
              return { ...orderRecord, ...data };
            },
          },
          invoice: {
            findFirst: async () => invoiceCreated,
            create: async ({ data }) => {
              invoiceCreated = data;
              return data;
            },
          },
        }),
    };

    const gateway = {
      verifyPayment: async () => ({
        status: 'success',
        reference: 'AC-P-TEST-REF',
        amount: order.totalAmount,
        currency: order.currency,
        providerEventId: 'paystack-event-1',
        paidAt: new Date(),
        raw: { id: 'paystack-event-1', status: 'success' },
      }),
    };

    const notify = async (n) => {
      notifications.push(n);
    };

    const result = await verifyAndSyncPayment(
      { buyerId: order.buyerId, orderId: order.id, reference: 'AC-P-TEST-REF' },
      { gateway, client, notify },
    );

    assert.equal(result.payment.status, PAYMENT_STATUSES.VERIFIED);
    assert.equal(orderStatus, 'paid');
    assert.equal(committedStock, true);
    assert.ok(invoiceCreated);
    assert.equal(notifications.length, 2); // 1 buyer + 1 admin
    assert.equal(result.alreadyVerified, false);

    // Repeated verification (idempotent)
    const repeated = await verifyAndSyncPayment(
      { buyerId: order.buyerId, orderId: order.id, reference: 'AC-P-TEST-REF' },
      { gateway, client, notify },
    );
    assert.equal(repeated.payment.status, PAYMENT_STATUSES.VERIFIED);
    assert.equal(repeated.alreadyVerified, true);
    assert.equal(notifications.length, 2); // No duplicate notifications sent
  });

  it('processes charge.success webhook idempotently and safely', async () => {
    let orderStatus = 'pending_payment';
    let paymentStatus = PAYMENT_STATUSES.PENDING_PROVIDER;
    let notifications = [];

    const orderRecord = {
      ...order,
      purchaseMode: 'DIRECT_SALE',
      stockReservationStatus: 'ACTIVE',
      buyer: { id: order.buyerId, email: 'buyer@example.com' },
    };
    const paymentRecord = payment({
      status: PAYMENT_STATUSES.PENDING_PROVIDER,
      providerRef: 'AC-P-WEBHOOK-REF',
    });

    const client = {
      payment: {
        findUnique: async () => ({
          ...paymentRecord,
          status: paymentStatus,
          order: orderRecord,
        }),
      },
      user: {
        findMany: async () => [{ id: 'admin-1' }],
      },
      $transaction: async (callback) =>
        callback({
          payment: {
            findUnique: async () => ({
              ...paymentRecord,
              status: paymentStatus,
              order: orderRecord,
            }),
            update: async ({ data }) => {
              paymentStatus = data.status;
              return { ...paymentRecord, ...data };
            },
          },
          order: {
            update: async ({ data }) => {
              orderStatus = data.status;
              return { ...orderRecord, ...data };
            },
          },
          invoice: {
            findFirst: async () => null,
            create: async ({ data }) => data,
          },
        }),
    };

    const gateway = {
      verifyWebhookSignature: ({ signature }) =>
        signature === 'valid-signature',
    };

    const webhookPayload = {
      event: 'charge.success',
      data: {
        reference: 'AC-P-WEBHOOK-REF',
        id: 987654321,
        amount: order.totalAmount,
        currency: order.currency,
        status: 'success',
        metadata: { orderId: order.id },
      },
    };

    const notify = async (n) => {
      notifications.push(n);
    };

    const result = await handlePaystackWebhook(
      {
        rawBody: JSON.stringify(webhookPayload),
        signature: 'valid-signature',
        eventPayload: webhookPayload,
      },
      { gateway, client, notify },
    );

    assert.equal(result.payment.status, PAYMENT_STATUSES.VERIFIED);
    assert.equal(orderStatus, 'paid');
    assert.equal(notifications.length, 2);

    // Repeated webhook delivery (idempotent)
    const repeated = await handlePaystackWebhook(
      {
        rawBody: JSON.stringify(webhookPayload),
        signature: 'valid-signature',
        eventPayload: webhookPayload,
      },
      { gateway, client, notify },
    );

    assert.equal(repeated.alreadyVerified, true);
    assert.equal(notifications.length, 2); // No duplicate notification
  });

  it('rejects invalid or missing webhook signatures', async () => {
    const gateway = {
      verifyWebhookSignature: () => false,
    };
    await assert.rejects(
      () =>
        handlePaystackWebhook(
          { rawBody: '{}', signature: 'bad-sig' },
          { gateway },
        ),
      (error) => error.code === 'UNAUTHORIZED' && error.status === 401,
    );
  });

  it('rejects malformed webhook payloads', async () => {
    const gateway = {
      verifyWebhookSignature: () => true,
    };
    await assert.rejects(
      () =>
        handlePaystackWebhook(
          { rawBody: '{ malformed json ', signature: 'valid-sig' },
          { gateway },
        ),
      (error) => error.code === 'VALIDATION_ERROR' && error.status === 400,
    );
  });

  it('rejects payment settlement on amount, currency, or reference mismatch', async () => {
    const orderRecord = {
      ...order,
      purchaseMode: 'DIRECT_SALE',
      stockReservationStatus: 'ACTIVE',
    };
    const paymentRecord = payment({
      status: PAYMENT_STATUSES.PENDING_PROVIDER,
      providerRef: 'AC-P-REF-1',
    });

    const client = {
      payment: {
        findUnique: async () => ({ ...paymentRecord, order: orderRecord }),
      },
    };

    // Amount mismatch
    await assert.rejects(
      () =>
        settlePaystackPayment(
          {
            paymentId: paymentRecord.id,
            providerRef: 'AC-P-REF-1',
            amount: 999999,
            currency: 'NGN',
            providerStatus: 'success',
          },
          { client },
        ),
      (error) => error.code === 'CONFLICT',
    );

    // Currency mismatch
    await assert.rejects(
      () =>
        settlePaystackPayment(
          {
            paymentId: paymentRecord.id,
            providerRef: 'AC-P-REF-1',
            amount: order.totalAmount,
            currency: 'USD',
            providerStatus: 'success',
          },
          { client },
        ),
      (error) => error.code === 'CONFLICT',
    );

    // Reference mismatch
    await assert.rejects(
      () =>
        settlePaystackPayment(
          {
            paymentId: paymentRecord.id,
            providerRef: 'AC-P-WRONG-REF',
            amount: order.totalAmount,
            currency: 'NGN',
            providerStatus: 'success',
          },
          { client },
        ),
      (error) => error.code === 'CONFLICT',
    );
  });

  it('rejects verification of unknown payment or unowned order', async () => {
    const client = {
      order: {
        findFirst: async ({ where }) =>
          where.buyerId === 'buyer-1' ? null : null,
      },
    };
    await assert.rejects(
      () =>
        verifyAndSyncPayment(
          { buyerId: 'intruder-buyer', orderId: order.id, reference: 'AC-P-1' },
          { client },
        ),
      (error) => error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN',
    );
  });

  it('does not commit stock or mark order paid on payment failure', async () => {
    let orderUpdated = false;
    let paymentStatus = PAYMENT_STATUSES.PENDING_PROVIDER;

    const orderRecord = {
      ...order,
      purchaseMode: 'DIRECT_SALE',
      stockReservationStatus: 'ACTIVE',
    };
    const paymentRecord = payment({
      status: PAYMENT_STATUSES.PENDING_PROVIDER,
      providerRef: 'AC-P-FAIL-REF',
    });

    const client = {
      payment: {
        findUnique: async () => ({
          ...paymentRecord,
          status: paymentStatus,
          order: orderRecord,
        }),
        update: async ({ data }) => {
          paymentStatus = data.status;
          return { ...paymentRecord, ...data };
        },
      },
      order: {
        update: async () => {
          orderUpdated = true;
        },
      },
    };

    const result = await settlePaystackPayment(
      {
        paymentId: paymentRecord.id,
        providerRef: 'AC-P-FAIL-REF',
        amount: order.totalAmount,
        currency: order.currency,
        providerStatus: 'failed',
      },
      { client },
    );

    assert.equal(result.status, PAYMENT_STATUSES.FAILED);
    assert.equal(paymentStatus, PAYMENT_STATUSES.FAILED);
    assert.equal(orderUpdated, false);
    assert.equal(orderRecord.status, 'pending_payment');
    assert.equal(orderRecord.stockReservationStatus, 'ACTIVE');
  });

  it('settles SOURCING_REQUIRED order without mutating stock reservations', async () => {
    let stockStatus = 'NONE';
    let orderStatus = 'pending_payment';

    const sourcingOrder = {
      ...order,
      purchaseMode: 'SOURCING_REQUIRED',
      stockReservationStatus: 'NONE',
    };
    const paymentRecord = payment({
      status: PAYMENT_STATUSES.PENDING_PROVIDER,
      providerRef: 'AC-P-SRC-REF',
    });

    const client = {
      payment: {
        findUnique: async () => ({ ...paymentRecord, order: sourcingOrder }),
      },
      user: { findMany: async () => [] },
      $transaction: async (callback) =>
        callback({
          payment: {
            findUnique: async () => ({
              ...paymentRecord,
              order: sourcingOrder,
            }),
            update: async ({ data }) => ({ ...paymentRecord, ...data }),
          },
          order: {
            update: async ({ data }) => {
              orderStatus = data.status;
              if (data.stockReservationStatus)
                stockStatus = data.stockReservationStatus;
              return { ...sourcingOrder, ...data };
            },
          },
          invoice: {
            findFirst: async () => null,
            create: async ({ data }) => data,
          },
        }),
    };

    const result = await settlePaystackPayment(
      {
        paymentId: paymentRecord.id,
        providerRef: 'AC-P-SRC-REF',
        amount: sourcingOrder.totalAmount,
        currency: sourcingOrder.currency,
        providerStatus: 'success',
      },
      { client, notify: () => {} },
    );

    assert.equal(result.payment.status, PAYMENT_STATUSES.VERIFIED);
    assert.equal(orderStatus, 'paid');
    assert.equal(stockStatus, 'NONE'); // stock reservation untouched
  });
});

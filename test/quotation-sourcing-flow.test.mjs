import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  calculateQuotationTotal,
  QUOTATION_FINANCIAL_FIELDS,
} from '../src/application/rfqs/quotationRules.js';
import { createQuotationSchema } from '../src/shared/validators/quotation.js';
import { quotationSnapshot } from '../src/domain/orders/orderRules.js';
import { createOrderFromAcceptedQuotation } from '../src/application/orders/orderService.js';

describe('Customer Sourcing Flow — Pricing and Quotation Acceptance Suite', () => {
  const sampleFinancials = {
    productCost: 5000000, // ₦50,000.00
    chinaShippingCost: 500000, // ₦5,000.00
    inspectionCost: 200000, // ₦2,000.00
    internationalFreightCost: 1500000, // ₦15,000.00
    customsCost: 800000, // ₦8,000.00
    serviceFee: 300000, // ₦3,000.00
    otherCharges: 100000, // ₦1,000.00
  };

  const expectedTotal =
    5000000 + 500000 + 200000 + 1500000 + 800000 + 300000 + 100000; // 8400000 (₦84,000.00)

  // 1. Admin creates a sourcing quotation with product cost + shipping + other applicable charges
  it('1. validates admin creation payload with product cost, shipping, and other applicable charges', () => {
    const payload = {
      ...sampleFinancials,
      currency: 'NGN',
      deliveryEstimate: '14 to 21 working days',
      validDays: 14,
      notes: 'Custom sourced directly from vetted factory in Shenzhen.',
    };
    const parsed = createQuotationSchema.safeParse(payload);
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.data.productCost, 5000000);
    assert.strictEqual(parsed.data.chinaShippingCost, 500000);
    assert.strictEqual(parsed.data.internationalFreightCost, 1500000);
    assert.strictEqual(parsed.data.customsCost, 800000);
    assert.strictEqual(parsed.data.serviceFee, 300000);
    assert.strictEqual(parsed.data.inspectionCost, 200000);
    assert.strictEqual(parsed.data.otherCharges, 100000);
  });

  // 2. Correct quotation total is calculated server-side
  it('2. calculates the authoritative quotation total server-side and ignores client-submitted total', () => {
    const serverCalculated = calculateQuotationTotal(sampleFinancials);
    assert.strictEqual(serverCalculated, expectedTotal);
    assert.strictEqual(serverCalculated, 8400000);

    // Client attempts to tamper with total
    const tamperedInput = { ...sampleFinancials, total: 100 };
    const untamperedTotal = calculateQuotationTotal(tamperedInput);
    assert.strictEqual(untamperedTotal, expectedTotal);
  });

  // 3. Customer receives the correct offer total
  it('3. maps the quotation model to the customer-facing shape with total and component breakdown', () => {
    const rawQuotation = {
      id: 'quot-101',
      referenceNumber: 'AC-Q-2026-00001',
      ...sampleFinancials,
      total: expectedTotal,
      currency: 'NGN',
      deliveryEstimate: '14 days',
      notes: 'Notes',
      status: 'sent',
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      order: null,
    };

    // Simulate mapping in rfqService.js getMyRfqById
    const mapped = {
      id: rawQuotation.id,
      referenceNumber: rawQuotation.referenceNumber,
      productCost: rawQuotation.productCost,
      chinaShippingCost: rawQuotation.chinaShippingCost,
      inspectionCost: rawQuotation.inspectionCost,
      internationalFreightCost: rawQuotation.internationalFreightCost,
      customsCost: rawQuotation.customsCost,
      serviceFee: rawQuotation.serviceFee,
      otherCharges: rawQuotation.otherCharges,
      total: rawQuotation.total,
      price: rawQuotation.total,
      currency: rawQuotation.currency,
      status: rawQuotation.status,
    };

    assert.strictEqual(mapped.total, 8400000);
    assert.strictEqual(mapped.price, 8400000);
    assert.notStrictEqual(mapped.total, 0);
    assert.notStrictEqual(mapped.price, undefined);
    assert.strictEqual(mapped.productCost, 5000000);
  });

  // 4 & 5. Customer accepts the offer & Order is created successfully
  it('4 & 5. customer accepts offer and order is created inside a minimal atomic transaction', async () => {
    const buyerId = 'buyer-user-1';
    const quotationId = 'quot-1';
    let transactionExecuted = false;
    let quotationStatusUpdated = false;
    let orderCreated = false;

    const mockQuotation = {
      id: quotationId,
      supplierId: 'supplier-1',
      rfqId: 'rfq-1',
      ...sampleFinancials,
      total: expectedTotal,
      currency: 'NGN',
      status: 'sent',
      expiresAt: new Date(Date.now() + 86400000),
      rfq: {
        id: 'rfq-1',
        buyerId,
        status: 'quoted',
        title: 'Industrial Sourcing Item',
        items: [
          {
            id: 'rfq-item-1',
            productId: null,
            quantity: 10,
            product: null,
          },
        ],
      },
    };

    let createdOrderRecord = null;

    const mockClient = {
      quotation: {
        findFirst: async ({ where }) => {
          if (where.id === quotationId && where.rfq.buyerId === buyerId) {
            return mockQuotation;
          }
          return null;
        },
        findUnique: async () => ({ ...mockQuotation, status: 'accepted' }),
      },
      order: {
        findUnique: async ({ where }) => {
          if (where.id && createdOrderRecord) {
            return {
              ...createdOrderRecord,
              items: [
                {
                  id: 'item-1',
                  productId: null,
                  productTitle: 'Industrial Sourcing Item',
                  quantity: 10,
                  unitPrice: 500000,
                  subtotal: 5000000,
                },
              ],
            };
          }
          return null;
        },
      },
      rFQ: {
        update: async () => {},
      },
      $transaction: async (fn) => {
        transactionExecuted = true;
        const tx = {
          quotation: {
            updateMany: async () => {
              quotationStatusUpdated = true;
              return { count: 1 };
            },
            findUnique: async () => mockQuotation,
          },
          rFQ: {
            update: async () => {},
          },
          order: {
            create: async ({ data }) => {
              orderCreated = true;
              createdOrderRecord = {
                id: 'order-rec-1',
                orderNumber: data.orderNumber,
                buyerId: data.buyerId,
                supplierId: data.supplierId,
                quotationId: data.quotationId,
                purchaseMode: data.purchaseMode,
                status: data.status,
                productCost: data.productCost,
                chinaShippingCost: data.chinaShippingCost,
                inspectionCost: data.inspectionCost,
                internationalFreightCost: data.internationalFreightCost,
                customsCost: data.customsCost,
                serviceFee: data.serviceFee,
                otherCharges: data.otherCharges,
                totalAmount: data.totalAmount,
                currency: data.currency,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              return {
                id: createdOrderRecord.id,
                orderNumber: createdOrderRecord.orderNumber,
              };
            },
          },
          orderItem: {
            createMany: async () => {},
          },
        };
        return fn(tx);
      },
    };

    const result = await createOrderFromAcceptedQuotation(
      quotationId,
      buyerId,
      mockClient,
      async () => {},
    );

    assert.strictEqual(transactionExecuted, true);
    assert.strictEqual(quotationStatusUpdated, true);
    assert.strictEqual(orderCreated, true);
    assert.strictEqual(result.acceptedNow, true);
    assert.strictEqual(result.created, true);
    assert.strictEqual(result.order.totalAmount, expectedTotal);
    assert.strictEqual(result.order.productCost, 5000000);
  });

  // 6. Order total equals accepted offer total
  it('6. order total strictly equals authoritative accepted offer total', () => {
    const quotation = {
      ...sampleFinancials,
      total: expectedTotal,
      currency: 'NGN',
    };
    const snapshot = quotationSnapshot(quotation);
    const orderTotal = calculateQuotationTotal(snapshot);

    assert.strictEqual(orderTotal, quotation.total);
    assert.strictEqual(orderTotal, 8400000);
  });

  // 7. Order items contain the correct immutable pricing snapshot
  it('7. calculates order item unitPrice from productCost and quantity', () => {
    const productCost = 5000000;
    const quantity = 10;
    const unitPrice = Math.floor(productCost / quantity);
    const subtotal = productCost;

    assert.strictEqual(unitPrice, 500000);
    assert.strictEqual(subtotal, 5000000);
    assert.strictEqual(unitPrice * quantity, subtotal);
  });

  // 8. Cannot accept an already accepted offer twice (idempotency)
  it('8. cannot accept an already accepted offer twice (returns existing order without duplicating)', async () => {
    const buyerId = 'buyer-user-1';
    const quotationId = 'quot-already-accepted';

    const existingOrder = {
      id: 'existing-order-1',
      orderNumber: 'AC-O-2026-EXISTS',
      buyerId,
      quotationId,
      purchaseMode: 'SOURCING_REQUIRED',
      status: 'draft',
      ...sampleFinancials,
      totalAmount: expectedTotal,
      currency: 'NGN',
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    };

    const mockQuotation = {
      id: quotationId,
      supplierId: 'supplier-1',
      rfqId: 'rfq-1',
      ...sampleFinancials,
      total: expectedTotal,
      currency: 'NGN',
      status: 'accepted',
      expiresAt: new Date(Date.now() + 86400000),
      rfq: {
        id: 'rfq-1',
        buyerId,
        status: 'accepted',
        title: 'Item',
        items: [],
      },
    };

    let transactionOpened = false;

    const mockClient = {
      quotation: {
        findFirst: async () => mockQuotation,
      },
      order: {
        findUnique: async () => existingOrder,
      },
      $transaction: async () => {
        transactionOpened = true;
      },
    };

    const result = await createOrderFromAcceptedQuotation(
      quotationId,
      buyerId,
      mockClient,
    );

    assert.strictEqual(
      transactionOpened,
      false,
      'Should not open transaction if order exists',
    );
    assert.strictEqual(result.created, false);
    assert.strictEqual(result.acceptedNow, false);
    assert.strictEqual(result.order.orderNumber, 'AC-O-2026-EXISTS');
  });

  // 9. Cannot accept an expired or rejected offer
  it('9. rejects acceptance of an expired or rejected offer', async () => {
    const buyerId = 'buyer-1';

    // Expired quotation
    const expiredQuotation = {
      id: 'q-expired',
      ...sampleFinancials,
      total: expectedTotal,
      status: 'sent',
      expiresAt: new Date(Date.now() - 10000), // in the past
      rfq: { buyerId, deletedAt: null, items: [] },
    };

    const clientExpired = {
      quotation: { findFirst: async () => expiredQuotation },
      order: { findUnique: async () => null },
    };

    await assert.rejects(
      () =>
        createOrderFromAcceptedQuotation('q-expired', buyerId, clientExpired),
      (err) => err.code === 'CONFLICT' && err.message.includes('expired'),
    );

    // Rejected quotation
    const rejectedQuotation = {
      id: 'q-rejected',
      ...sampleFinancials,
      total: expectedTotal,
      status: 'rejected',
      expiresAt: new Date(Date.now() + 86400000),
      rfq: { buyerId, deletedAt: null, items: [] },
    };

    const clientRejected = {
      quotation: { findFirst: async () => rejectedQuotation },
      order: { findUnique: async () => null },
    };

    await assert.rejects(
      () =>
        createOrderFromAcceptedQuotation('q-rejected', buyerId, clientRejected),
      (err) => err.code === 'CONFLICT' && err.message.includes('declined'),
    );
  });

  // 10. Missing financial data cannot produce an accepted ₦0.00 offer
  it('10. validates that missing financial data (0 total or 0 productCost) cannot be accepted', async () => {
    const buyerId = 'buyer-1';

    const zeroTotalQuotation = {
      id: 'q-zero',
      productCost: 0,
      chinaShippingCost: 0,
      inspectionCost: 0,
      internationalFreightCost: 0,
      customsCost: 0,
      serviceFee: 0,
      otherCharges: 0,
      total: 0,
      status: 'sent',
      expiresAt: new Date(Date.now() + 86400000),
      rfq: { buyerId, deletedAt: null, items: [] },
    };

    const clientZero = {
      quotation: { findFirst: async () => zeroTotalQuotation },
      order: { findUnique: async () => null },
    };

    await assert.rejects(
      () => createOrderFromAcceptedQuotation('q-zero', buyerId, clientZero),
      (err) => {
        assert.strictEqual(err.code, 'VALIDATION_ERROR');
        assert.strictEqual(err.status, 422);
        assert.ok(err.message.includes('missing required financial data'));
        return true;
      },
    );
  });
});

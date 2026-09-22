import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  getOrderInvoice,
  toPublicInvoice,
} from '../src/application/invoices/invoiceService.js';
import { cancelDirectSaleOrder } from '../src/application/orders/directSaleOrderService.js';
import { settlePaystackPayment } from '../src/application/payments/paymentService.js';
import { getAuthorizationPolicy } from '../src/shared/lib/authorization.js';

describe('Phase 4A: Direct Sale Invoice Access', () => {
  const baseOrder = {
    id: 'ord-100',
    orderNumber: 'AC-O-2026-ABC1234',
    buyerId: 'buyer-1',
    purchaseMode: 'DIRECT_SALE',
    status: 'paid',
    totalAmount: 1500000,
    currency: 'NGN',
    shippingAddress: '12 Marina Road, Lagos',
    createdAt: new Date('2026-09-20T10:00:00Z'),
    updatedAt: new Date('2026-09-20T10:05:00Z'),
    buyer: {
      id: 'buyer-1',
      name: 'Adewale Johnson',
      email: 'adewale@example.com',
      phone: '+2348012345678',
    },
    payments: [
      {
        id: 'pay-1',
        provider: 'paystack',
        providerRef: 'pstk_ref_12345',
        amount: 1500000,
        currency: 'NGN',
        status: 'VERIFIED',
        verifiedAt: new Date('2026-09-20T10:05:00Z'),
        createdAt: new Date('2026-09-20T10:00:00Z'),
      },
    ],
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productTitle: 'Industrial Solar Inverter 5kW',
        quantity: 1,
        unitPrice: 1500000,
        currency: 'NGN',
        subtotal: 1500000,
      },
    ],
  };

  const baseInvoice = {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-FFAA1122',
    orderId: 'ord-100',
    paymentId: 'pay-1',
    createdAt: new Date('2026-09-20T10:05:00Z'),
    updatedAt: new Date('2026-09-20T10:05:00Z'),
    order: baseOrder,
  };

  function createMockClient(invoiceData = baseInvoice) {
    return {
      invoice: {
        findFirst: async ({ where }) => {
          if (where.orderId === invoiceData.orderId) {
            return invoiceData;
          }
          return null;
        },
      },
    };
  }

  it('1. authenticated owner can retrieve invoice', async () => {
    const requester = { id: 'buyer-1', role: { code: 'buyer' } };
    const invoice = await getOrderInvoice('ord-100', requester, {
      client: createMockClient(),
    });

    assert.strictEqual(invoice.id, 'inv-1');
    assert.strictEqual(invoice.invoiceNumber, 'INV-2026-FFAA1122');
    assert.strictEqual(invoice.orderNumber, 'AC-O-2026-ABC1234');
    assert.strictEqual(invoice.totalAmount, 1500000);
    assert.strictEqual(invoice.buyer.email, 'adewale@example.com');
    assert.strictEqual(invoice.payment.providerRef, 'pstk_ref_12345');
    assert.strictEqual(invoice.items.length, 1);
  });

  it('2. non-owner cannot retrieve invoice (returns 404 / access denied)', async () => {
    const requester = { id: 'buyer-attacker', role: { code: 'buyer' } };
    await assert.rejects(
      async () => {
        await getOrderInvoice('ord-100', requester, {
          client: createMockClient(),
        });
      },
      (err) => {
        assert.strictEqual(err.status, 404);
        return true;
      },
    );
  });

  it('3. unauthenticated request rejected (401)', async () => {
    await assert.rejects(
      async () => {
        await getOrderInvoice('ord-100', null, {
          client: createMockClient(),
        });
      },
      (err) => {
        assert.strictEqual(err.status, 401);
        return true;
      },
    );
  });

  it('4. admin authorization works according to existing convention', async () => {
    const adminRequester = { id: 'admin-1', role: { code: 'admin' } };
    const invoice = await getOrderInvoice('ord-100', adminRequester, {
      client: createMockClient(),
    });

    assert.strictEqual(invoice.id, 'inv-1');
    assert.strictEqual(invoice.invoiceNumber, 'INV-2026-FFAA1122');
  });

  it('5. invoice uses persisted historical values (does not recalculate from product prices)', async () => {
    // Order item unitPrice is 1,500,000 even if current product price were different
    const invoice = toPublicInvoice(baseInvoice);
    assert.strictEqual(invoice.items[0].unitPrice, 1500000);
    assert.strictEqual(invoice.items[0].subtotal, 1500000);
    assert.strictEqual(invoice.totalAmount, 1500000);
  });

  it('6. invoice does not expose sourcing-only fields', async () => {
    const sourcingExtendedOrder = {
      ...baseOrder,
      quotationId: 'quot-123',
      quotation: { id: 'quot-123', referenceNumber: 'QUO-1' },
      rfqId: 'rfq-123',
      supplierId: 'supp-1',
      chinaShippingCost: 50000,
      inspectionCost: 20000,
      internationalFreightCost: 80000,
      customsCost: 40000,
      serviceFee: 30000,
      otherCharges: 10000,
    };

    const invoice = toPublicInvoice({
      ...baseInvoice,
      order: sourcingExtendedOrder,
    });

    assert.strictEqual(invoice.quotationId, undefined);
    assert.strictEqual(invoice.quotation, undefined);
    assert.strictEqual(invoice.rfqId, undefined);
    assert.strictEqual(invoice.supplierId, undefined);
    assert.strictEqual(invoice.chinaShippingCost, undefined);
    assert.strictEqual(invoice.inspectionCost, undefined);
    assert.strictEqual(invoice.internationalFreightCost, undefined);
    assert.strictEqual(invoice.customsCost, undefined);
    assert.strictEqual(invoice.serviceFee, undefined);
    assert.strictEqual(invoice.otherCharges, undefined);
  });
});

describe('Phase 4A: Safe Direct Sale Order Cancellation', () => {
  function createCancellationMockDb({
    orderStatus = 'pending_payment',
    purchaseMode = 'DIRECT_SALE',
    stockReservationStatus = 'ACTIVE',
    buyerId = 'buyer-1',
    payments = [],
    initialProductStock = 10,
    itemQuantity = 2,
  } = {}) {
    let currentStock = initialProductStock;
    let currentOrderStatus = orderStatus;
    let currentReservationStatus = stockReservationStatus;

    const mockOrder = {
      id: 'ord-test-1',
      orderNumber: 'AC-O-2026-CANCEL1',
      buyerId,
      purchaseMode,
      status: currentOrderStatus,
      stockReservationStatus: currentReservationStatus,
      totalAmount: 50000,
      currency: 'NGN',
      createdAt: new Date('2026-09-20T10:00:00Z'),
      updatedAt: new Date('2026-09-20T10:00:00Z'),
      buyer: { id: buyerId, name: 'Buyer', email: 'buyer@example.com' },
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          productTitle: 'Product Test',
          quantity: itemQuantity,
          unitPrice: 25000,
          currency: 'NGN',
          subtotal: 50000,
        },
      ],
      payments,
      shipments: [],
    };

    const client = {
      order: {
        findUnique: async ({ where }) => {
          if (where.id === mockOrder.id) {
            return {
              ...mockOrder,
              status: currentOrderStatus,
              stockReservationStatus: currentReservationStatus,
            };
          }
          return null;
        },
        update: async ({ data }) => {
          if (data.status) currentOrderStatus = data.status;
          if (data.stockReservationStatus) {
            currentReservationStatus = data.stockReservationStatus;
          }
          return {
            ...mockOrder,
            status: currentOrderStatus,
            stockReservationStatus: currentReservationStatus,
          };
        },
      },
      product: {
        update: async ({ data }) => {
          if (data.stock?.increment) {
            currentStock += data.stock.increment;
          }
          return { id: 'prod-1', stock: currentStock };
        },
      },
      $transaction: async (fn) => {
        return fn({
          order: {
            findUnique: async () => ({
              id: mockOrder.id,
              status: currentOrderStatus,
              stockReservationStatus: currentReservationStatus,
              items: mockOrder.items,
            }),
            update: async ({ data }) => {
              if (data.status) currentOrderStatus = data.status;
              if (data.stockReservationStatus) {
                currentReservationStatus = data.stockReservationStatus;
              }
              return {
                ...mockOrder,
                status: currentOrderStatus,
                stockReservationStatus: currentReservationStatus,
              };
            },
          },
          product: {
            update: async ({ data }) => {
              if (data.stock?.increment) {
                currentStock += data.stock.increment;
              }
              return { id: 'prod-1', stock: currentStock };
            },
          },
        });
      },
      getStock: () => currentStock,
      getStatus: () => currentOrderStatus,
      getReservationStatus: () => currentReservationStatus,
    };

    return client;
  }

  it('7. customer can cancel own PENDING_PAYMENT Direct Sale order', async () => {
    const db = createCancellationMockDb();
    const result = await cancelDirectSaleOrder('ord-test-1', 'buyer-1', {
      client: db,
    });

    assert.strictEqual(result.status, 'cancelled');
    assert.strictEqual(db.getStatus(), 'cancelled');
  });

  it('8. cancellation releases ACTIVE reservation and restores product stock', async () => {
    const db = createCancellationMockDb({
      initialProductStock: 10,
      itemQuantity: 3,
      stockReservationStatus: 'ACTIVE',
    });

    await cancelDirectSaleOrder('ord-test-1', 'buyer-1', { client: db });

    assert.strictEqual(db.getStock(), 13);
    assert.strictEqual(db.getReservationStatus(), 'RELEASED');
  });

  it('9. cancellation cannot release stock twice (idempotent stock protection)', async () => {
    const db = createCancellationMockDb({
      initialProductStock: 10,
      itemQuantity: 3,
      stockReservationStatus: 'RELEASED', // already released
    });

    await cancelDirectSaleOrder('ord-test-1', 'buyer-1', { client: db });

    assert.strictEqual(db.getStock(), 10); // Not incremented again
    assert.strictEqual(db.getStatus(), 'cancelled');
  });

  it('10. cancelled order cannot be cancelled again (throws 409 conflict)', async () => {
    const db = createCancellationMockDb({ orderStatus: 'cancelled' });

    await assert.rejects(
      async () => {
        await cancelDirectSaleOrder('ord-test-1', 'buyer-1', { client: db });
      },
      (err) => {
        assert.strictEqual(err.status, 409);
        assert.match(err.message, /already cancelled/i);
        return true;
      },
    );
  });

  it('11. PAID order cannot be cancelled', async () => {
    const db = createCancellationMockDb({ orderStatus: 'paid' });

    await assert.rejects(
      async () => {
        await cancelDirectSaleOrder('ord-test-1', 'buyer-1', { client: db });
      },
      (err) => {
        assert.strictEqual(err.status, 409);
        return true;
      },
    );
  });

  it('12. IN_PRODUCTION order cannot be cancelled', async () => {
    const db = createCancellationMockDb({ orderStatus: 'in_production' });

    await assert.rejects(
      async () => {
        await cancelDirectSaleOrder('ord-test-1', 'buyer-1', { client: db });
      },
      (err) => {
        assert.strictEqual(err.status, 409);
        return true;
      },
    );
  });

  it('13. SHIPPED order cannot be cancelled', async () => {
    const db = createCancellationMockDb({ orderStatus: 'shipped' });

    await assert.rejects(
      async () => {
        await cancelDirectSaleOrder('ord-test-1', 'buyer-1', { client: db });
      },
      (err) => {
        assert.strictEqual(err.status, 409);
        return true;
      },
    );
  });

  it('14. DELIVERED order cannot be cancelled', async () => {
    const db = createCancellationMockDb({ orderStatus: 'delivered' });

    await assert.rejects(
      async () => {
        await cancelDirectSaleOrder('ord-test-1', 'buyer-1', { client: db });
      },
      (err) => {
        assert.strictEqual(err.status, 409);
        return true;
      },
    );
  });

  it('15. COMPLETED order cannot be cancelled', async () => {
    const db = createCancellationMockDb({ orderStatus: 'completed' });

    await assert.rejects(
      async () => {
        await cancelDirectSaleOrder('ord-test-1', 'buyer-1', { client: db });
      },
      (err) => {
        assert.strictEqual(err.status, 409);
        return true;
      },
    );
  });

  it("16. customer cannot cancel another customer's order (returns 404)", async () => {
    const db = createCancellationMockDb({ buyerId: 'buyer-1' });

    await assert.rejects(
      async () => {
        await cancelDirectSaleOrder('ord-test-1', 'buyer-attacker', {
          client: db,
        });
      },
      (err) => {
        assert.strictEqual(err.status, 404);
        return true;
      },
    );
  });

  it('17. sourcing-required order cannot be cancelled via direct sale cancel', async () => {
    const db = createCancellationMockDb({ purchaseMode: 'SOURCING_REQUIRED' });

    await assert.rejects(
      async () => {
        await cancelDirectSaleOrder('ord-test-1', 'buyer-1', { client: db });
      },
      (err) => {
        assert.strictEqual(err.status, 409);
        assert.match(err.message, /direct-sale/i);
        return true;
      },
    );
  });

  it('18. cancellation/payment race cannot produce CANCELLED + VERIFIED/PAID', async () => {
    // Settle payment on an already cancelled order
    const mockPayment = {
      id: 'pay-race-1',
      provider: 'paystack',
      providerRef: 'ref-race-1',
      amount: 50000,
      currency: 'NGN',
      status: 'PENDING_PROVIDER',
      order: {
        id: 'ord-race-1',
        orderNumber: 'AC-O-RACE',
        buyerId: 'buyer-1',
        purchaseMode: 'DIRECT_SALE',
        stockReservationStatus: 'RELEASED',
        status: 'cancelled',
        totalAmount: 50000,
        currency: 'NGN',
      },
    };

    const mockClient = {
      payment: {
        findUnique: async () => mockPayment,
      },
      $transaction: async (fn) => {
        return fn({
          payment: {
            findUnique: async () => mockPayment,
          },
        });
      },
    };

    await assert.rejects(
      async () => {
        await settlePaystackPayment(
          {
            paymentId: 'pay-race-1',
            providerRef: 'ref-race-1',
            amount: 50000,
            currency: 'NGN',
            providerStatus: 'success',
          },
          { client: mockClient },
        );
      },
      (err) => {
        assert.strictEqual(err.status, 409);
        assert.match(err.message, /cancelled/i);
        return true;
      },
    );
  });

  it('19. successful payment cannot later release committed stock', async () => {
    const db = createCancellationMockDb({
      stockReservationStatus: 'COMMITTED',
      orderStatus: 'pending_payment',
    });

    await assert.rejects(
      async () => {
        await cancelDirectSaleOrder('ord-test-1', 'buyer-1', { client: db });
      },
      (err) => {
        assert.strictEqual(err.status, 409);
        assert.match(err.message, /committed/i);
        return true;
      },
    );
  });

  it('20. cancellation is server-enforced even if UI is bypassed (API authorization rules)', () => {
    const customerCancelPolicy = getAuthorizationPolicy(
      '/api/v1/orders/ord-100/cancel',
    );
    assert.strictEqual(customerCancelPolicy.authRequired, true);
    assert.deepStrictEqual(customerCancelPolicy.allowRoles, ['buyer']);

    const customerInvoicePolicy = getAuthorizationPolicy(
      '/api/v1/orders/ord-100/invoice',
    );
    assert.strictEqual(customerInvoicePolicy.authRequired, true);
    assert.deepStrictEqual(customerInvoicePolicy.allowRoles, ['buyer']);

    const adminInvoicePolicy = getAuthorizationPolicy(
      '/api/v1/admin/orders/ord-100/invoice',
    );
    assert.strictEqual(adminInvoicePolicy.authRequired, true);
    assert.deepStrictEqual(adminInvoicePolicy.allowRoles, ['admin']);
  });
});

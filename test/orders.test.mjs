import assert from 'node:assert';
import { describe, it } from 'node:test';
import { getAuthorizationPolicy } from '../src/shared/lib/authorization.js';
import {
  isAcceptedQuotation,
  isCheckoutEligible,
  quotationSnapshot,
} from '../src/domain/orders/orderRules.js';

describe('Order business rules', () => {
  it('accepts only non-expired accepted quotations', () => {
    assert.strictEqual(isAcceptedQuotation({ status: 'accepted' }), true);
    assert.strictEqual(isAcceptedQuotation({ status: 'sent' }), false);
    assert.strictEqual(
      isAcceptedQuotation({
        status: 'accepted',
        expiresAt: new Date(Date.now() - 1000),
      }),
      false,
    );
  });

  it('allows checkout only from draft', () => {
    assert.strictEqual(isCheckoutEligible('draft'), true);
    assert.strictEqual(isCheckoutEligible('pending_payment'), false);
    assert.strictEqual(isCheckoutEligible('paid'), false);
  });

  it('copies only authoritative quotation financial fields', () => {
    const quotation = {
      productCost: 1000,
      chinaShippingCost: 200,
      inspectionCost: 300,
      internationalFreightCost: 400,
      customsCost: 500,
      serviceFee: 600,
      otherCharges: 700,
      total: 3700,
      currency: 'NGN',
      buyerId: 'attacker-controlled',
    };
    assert.deepStrictEqual(quotationSnapshot(quotation), {
      productCost: 1000,
      chinaShippingCost: 200,
      inspectionCost: 300,
      internationalFreightCost: 400,
      customsCost: 500,
      serviceFee: 600,
      otherCharges: 700,
    });
  });
});

describe('Order authorization policy', () => {
  it('restricts customer order APIs to buyers', () => {
    assert.deepStrictEqual(getAuthorizationPolicy('/api/v1/orders'), {
      type: 'api',
      authRequired: true,
      allowRoles: ['buyer'],
    });
    assert.deepStrictEqual(
      getAuthorizationPolicy('/api/v1/orders/order-1/checkout'),
      {
        type: 'api',
        authRequired: true,
        allowRoles: ['buyer'],
      },
    );
  });

  it('restricts admin order APIs and pages to admins', () => {
    assert.deepStrictEqual(getAuthorizationPolicy('/api/v1/admin/orders'), {
      type: 'api',
      authRequired: true,
      allowRoles: ['admin'],
    });
    assert.deepStrictEqual(getAuthorizationPolicy('/admin/orders/order-1'), {
      type: 'page',
      authRequired: true,
      allowRoles: ['admin'],
    });
  });

  it('protects dynamic customer order and checkout pages', () => {
    assert.deepStrictEqual(getAuthorizationPolicy('/orders/order-1'), {
      type: 'page',
      authRequired: true,
      allowRoles: ['buyer'],
    });
    assert.deepStrictEqual(getAuthorizationPolicy('/checkout/order-1'), {
      type: 'page',
      authRequired: true,
      allowRoles: ['buyer'],
    });
  });
});

import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  calculateQuotationTotal,
  canTransitionQuotation,
  isQuotationExpired,
} from '../src/application/rfqs/quotationRules.js';
import {
  getAuthorizationPolicy,
  canAccessPath,
} from '../src/shared/lib/authorization.js';

describe('Quotation lifecycle rules', () => {
  it('calculates total from all integer minor-unit components', () => {
    assert.strictEqual(
      calculateQuotationTotal({
        productCost: 100000,
        chinaShippingCost: 20000,
        inspectionCost: 5000,
        internationalFreightCost: 30000,
        customsCost: 10000,
        serviceFee: 5000,
        otherCharges: 0,
      }),
      170000,
    );
  });

  it('does not allow a client total to affect server calculation', () => {
    assert.strictEqual(
      calculateQuotationTotal({ productCost: 100, total: 1 }),
      100,
    );
  });

  it('allows only draft-to-sent and sent-to-decision transitions', () => {
    assert.strictEqual(canTransitionQuotation('draft', 'sent'), true);
    assert.strictEqual(canTransitionQuotation('sent', 'accepted'), true);
    assert.strictEqual(canTransitionQuotation('sent', 'rejected'), true);
    assert.strictEqual(canTransitionQuotation('draft', 'accepted'), false);
    assert.strictEqual(canTransitionQuotation('accepted', 'sent'), false);
  });

  it('detects expiration server-side', () => {
    const now = new Date('2026-09-14T12:00:00.000Z');
    assert.strictEqual(
      isQuotationExpired(
        { expiresAt: new Date('2026-09-14T11:59:00.000Z') },
        now,
      ),
      true,
    );
    assert.strictEqual(
      isQuotationExpired(
        { expiresAt: new Date('2026-09-14T13:00:00.000Z') },
        now,
      ),
      false,
    );
  });
});

describe('Quotation route authorization', () => {
  const buyer = { role: { code: 'buyer' } };
  const admin = { role: { code: 'admin' } };

  it('protects customer and admin quotation pages', () => {
    assert.deepStrictEqual(getAuthorizationPolicy('/quotations'), {
      type: 'page',
      authRequired: true,
      allowRoles: ['buyer'],
    });
    assert.strictEqual(canAccessPath(buyer, '/admin/quotations'), false);
    assert.strictEqual(canAccessPath(admin, '/admin/quotations'), true);
  });
});

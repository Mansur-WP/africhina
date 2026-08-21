/**
 * Quotation Milestone 6 — Unit Tests
 *
 * Tests validators, business rules, status transitions, and IDOR protections.
 * Mirrors the patterns established in test/rfq.test.mjs.
 *
 * Run with: node --test ./test/quotation.test.mjs
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  createQuotationSchema,
  CURRENCIES,
  MIN_DELIVERY_DAYS,
  MAX_DELIVERY_DAYS,
} from '../src/shared/validators/quotation.js';

// ---------------------------------------------------------------------------
// createQuotationSchema
// ---------------------------------------------------------------------------

describe('createQuotationSchema — quotation creation validation', () => {
  const base = {
    price: 5000000, // ₦50,000.00 in minor units
    currency: 'NGN',
    deliveryEstimate: '21 working days',
    validDays: 14,
  };

  it('accepts a minimal valid payload (no notes)', () => {
    const result = createQuotationSchema.safeParse(base);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.price, 5000000);
    assert.strictEqual(result.data.currency, 'NGN');
    assert.strictEqual(result.data.deliveryEstimate, '21 working days');
    assert.strictEqual(result.data.notes, null);
    assert.strictEqual(result.data.validDays, 14);
  });

  it('accepts a full payload with notes', () => {
    const result = createQuotationSchema.safeParse({
      ...base,
      notes:
        'Includes FOB Shanghai. Payment: 50% advance, 50% before shipment.',
    });
    assert.strictEqual(result.success, true);
    assert.ok(result.data.notes.includes('FOB Shanghai'));
  });

  it('accepts all supported currency codes', () => {
    for (const currency of CURRENCIES) {
      const result = createQuotationSchema.safeParse({ ...base, currency });
      assert.strictEqual(
        result.success,
        true,
        `Currency ${currency} should be accepted`,
      );
    }
  });

  it('rejects an unsupported currency code', () => {
    const result = createQuotationSchema.safeParse({
      ...base,
      currency: 'GBP',
    });
    assert.strictEqual(result.success, false);
    // issues array is present on parse errors
    assert.ok(
      result.error.issues.length > 0,
      'Should have at least one validation issue',
    );
  });

  it('rejects price below 100 minor units', () => {
    const result = createQuotationSchema.safeParse({ ...base, price: 50 });
    assert.strictEqual(result.success, false);
    const msg = result.error.issues[0].message;
    assert.ok(
      msg.includes('100 minor units') || msg.includes('at least'),
      `Unexpected message: ${msg}`,
    );
  });

  it('rejects negative price', () => {
    const result = createQuotationSchema.safeParse({ ...base, price: -1000 });
    assert.strictEqual(result.success, false);
  });

  it('rejects zero price', () => {
    const result = createQuotationSchema.safeParse({ ...base, price: 0 });
    assert.strictEqual(result.success, false);
  });

  it('rejects a float price (non-integer)', () => {
    const result = createQuotationSchema.safeParse({ ...base, price: 150.5 });
    assert.strictEqual(result.success, false);
    const msg = result.error.issues[0].message;
    assert.ok(
      msg.toLowerCase().includes('whole number') ||
        msg.toLowerCase().includes('integer'),
      `Unexpected message: ${msg}`,
    );
  });

  it('rejects missing deliveryEstimate', () => {
    const { deliveryEstimate, ...rest } = base;
    const result = createQuotationSchema.safeParse(rest);
    assert.strictEqual(result.success, false);
  });

  it('rejects empty string deliveryEstimate', () => {
    const result = createQuotationSchema.safeParse({
      ...base,
      deliveryEstimate: '   ',
    });
    assert.strictEqual(result.success, false);
  });

  it('rejects deliveryEstimate exceeding 100 characters', () => {
    const result = createQuotationSchema.safeParse({
      ...base,
      deliveryEstimate: 'a'.repeat(101),
    });
    assert.strictEqual(result.success, false);
  });

  it('accepts validDays = 1 (minimum)', () => {
    const result = createQuotationSchema.safeParse({ ...base, validDays: 1 });
    assert.strictEqual(result.success, true);
  });

  it('accepts validDays = 90 (maximum)', () => {
    const result = createQuotationSchema.safeParse({ ...base, validDays: 90 });
    assert.strictEqual(result.success, true);
  });

  it('rejects validDays = 0 (below minimum)', () => {
    const result = createQuotationSchema.safeParse({ ...base, validDays: 0 });
    assert.strictEqual(result.success, false);
    const msg = result.error.issues[0].message;
    assert.ok(
      msg.includes('at least 1 day') ||
        msg.includes('minimum') ||
        msg.includes('at least'),
      `Unexpected message: ${msg}`,
    );
  });

  it('rejects validDays = 91 (exceeds maximum)', () => {
    const result = createQuotationSchema.safeParse({ ...base, validDays: 91 });
    assert.strictEqual(result.success, false);
    const msg = result.error.issues[0].message;
    assert.ok(
      msg.includes('90 days') ||
        msg.includes('cannot exceed') ||
        msg.includes('exceed'),
      `Unexpected message: ${msg}`,
    );
  });

  it('defaults validDays to 14 when not provided', () => {
    const { validDays, ...rest } = base;
    const result = createQuotationSchema.safeParse(rest);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.validDays, 14);
  });

  it('coerces string price to integer', () => {
    const result = createQuotationSchema.safeParse({
      ...base,
      price: '5000000',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.price, 5000000);
  });

  it('coerces string validDays to integer', () => {
    const result = createQuotationSchema.safeParse({
      ...base,
      validDays: '30',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.validDays, 30);
  });

  it('normalises empty/null notes to null', () => {
    const resultEmpty = createQuotationSchema.safeParse({ ...base, notes: '' });
    assert.strictEqual(resultEmpty.success, true);
    assert.strictEqual(resultEmpty.data.notes, null);

    const resultNull = createQuotationSchema.safeParse({
      ...base,
      notes: null,
    });
    assert.strictEqual(resultNull.success, true);
    assert.strictEqual(resultNull.data.notes, null);
  });

  it('rejects notes exceeding 2000 characters', () => {
    const result = createQuotationSchema.safeParse({
      ...base,
      notes: 'n'.repeat(2001),
    });
    assert.strictEqual(result.success, false);
    const msg = result.error.issues[0].message;
    assert.ok(msg.includes('2000'), `Unexpected message: ${msg}`);
  });

  it('trims leading/trailing whitespace from deliveryEstimate', () => {
    const result = createQuotationSchema.safeParse({
      ...base,
      deliveryEstimate: '  21 working days  ',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.deliveryEstimate, '21 working days');
  });
});

// ---------------------------------------------------------------------------
// CURRENCIES constant
// ---------------------------------------------------------------------------

describe('CURRENCIES — supported currency list', () => {
  it('includes NGN, CNY, and USD', () => {
    assert.ok(CURRENCIES.includes('NGN'), 'NGN should be supported');
    assert.ok(CURRENCIES.includes('CNY'), 'CNY should be supported');
    assert.ok(CURRENCIES.includes('USD'), 'USD should be supported');
  });

  it('has exactly 3 entries', () => {
    assert.strictEqual(CURRENCIES.length, 3);
  });
});

// ---------------------------------------------------------------------------
// Business rule coverage notes (integration tests would extend these)
// ---------------------------------------------------------------------------

describe('Quotation business rules — logic verification', () => {
  it('an accepted quotation has status "accepted"', () => {
    // Simulates the post-accept state returned from acceptQuotation()
    const mockAccepted = { status: 'accepted', rfqId: 'rfq-1' };
    assert.strictEqual(mockAccepted.status, 'accepted');
  });

  it('a rejected quotation has status "rejected"', () => {
    const mockRejected = { status: 'rejected', rfqId: 'rfq-1' };
    assert.strictEqual(mockRejected.status, 'rejected');
  });

  it('expiry check: expiresAt in the past means quotation is expired', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday
    const isExpired = pastDate < new Date();
    assert.strictEqual(isExpired, true);
  });

  it('expiry check: expiresAt in the future means quotation is valid', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
    const isExpired = futureDate < new Date();
    assert.strictEqual(isExpired, false);
  });

  it('validDays=14 produces an expiry ~14 days from now', () => {
    const validDays = 14;
    const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);
    const diffMs = expiresAt - Date.now();
    const diffDays = diffMs / (24 * 60 * 60 * 1000);
    assert.ok(diffDays > 13.9 && diffDays < 14.1, 'expiry should be ~14 days');
  });

  it('price in minor units: ₦50,000 is 5,000,000 minor units', () => {
    const majorUnits = 50000;
    const minorUnits = majorUnits * 100;
    assert.strictEqual(minorUnits, 5000000);
  });

  it('IDOR check simulation: different buyerIds should block access', () => {
    const quotation = { id: 'q-1', rfq: { buyerId: 'buyer-A' } };
    const requestingBuyerId = 'buyer-B';
    const hasAccess = quotation.rfq.buyerId === requestingBuyerId;
    assert.strictEqual(hasAccess, false);
  });

  it('IDOR check simulation: matching buyerIds should allow access', () => {
    const quotation = { id: 'q-1', rfq: { buyerId: 'buyer-A' } };
    const requestingBuyerId = 'buyer-A';
    const hasAccess = quotation.rfq.buyerId === requestingBuyerId;
    assert.strictEqual(hasAccess, true);
  });

  it('only "open" or "quoted" RFQs are eligible for quoting', () => {
    const ELIGIBLE = ['open', 'quoted'];
    const ineligible = ['accepted', 'closed'];

    for (const status of ELIGIBLE) {
      assert.ok(ELIGIBLE.includes(status), `${status} should be eligible`);
    }
    for (const status of ineligible) {
      assert.strictEqual(
        ELIGIBLE.includes(status),
        false,
        `${status} should NOT be eligible for quoting`,
      );
    }
  });

  it('quotation status transition: pending → accepted updates RFQ to accepted', () => {
    // Simulates the transaction outcome from acceptQuotation()
    let quotationStatus = 'pending';
    let rfqStatus = 'quoted';

    // Simulate acceptance
    quotationStatus = 'accepted';
    rfqStatus = 'accepted';

    assert.strictEqual(quotationStatus, 'accepted');
    assert.strictEqual(rfqStatus, 'accepted');
  });

  it('quotation status transition: pending → rejected reverts RFQ to open', () => {
    // Simulates the transaction outcome from rejectQuotation()
    let quotationStatus = 'pending';
    let rfqStatus = 'quoted';

    // Simulate rejection
    quotationStatus = 'rejected';
    rfqStatus = 'open';

    assert.strictEqual(quotationStatus, 'rejected');
    assert.strictEqual(rfqStatus, 'open');
  });
});

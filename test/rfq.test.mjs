/**
 * RFQ Milestone 5 — Unit Tests
 *
 * Tests validators, RFQ authorization policy, and reference number format.
 * Mirrors the patterns established in test/product.test.mjs.
 *
 * Run with: node --test ./test/rfq.test.mjs
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  createRfqSchema,
  rfqListQuerySchema,
  rfqIdSchema,
  CANCELLABLE_STATUSES,
  RFQ_REF_PREFIX,
  RFQ_PAGE_SIZE_DEFAULT,
} from '../src/shared/validators/rfq.js';

import {
  canAccessPath,
  getAuthorizationPolicy,
} from '../src/shared/lib/authorization.js';

// ---------------------------------------------------------------------------
// createRfqSchema
// ---------------------------------------------------------------------------

describe('createRfqSchema — create RFQ validation', () => {
  const base = {
    quantity: 100,
    destination: 'Kano, Nigeria',
  };

  it('accepts a minimal valid payload (no productId, no notes)', () => {
    const result = createRfqSchema.safeParse({
      ...base,
      productDescription: 'Wireless earbuds',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.quantity, 100);
    assert.strictEqual(result.data.destination, 'Kano, Nigeria');
    assert.strictEqual(result.data.productId, null);
    assert.strictEqual(result.data.notes, null);
  });

  it('accepts a full payload with all fields', () => {
    const result = createRfqSchema.safeParse({
      ...base,
      productId: 'prod_abc123',
      notes: 'Black colour only, retail packaging.',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.productId, 'prod_abc123');
    assert.strictEqual(
      result.data.notes,
      'Black colour only, retail packaging.',
    );
  });

  it('rejects quantity below 1', () => {
    assert.strictEqual(
      createRfqSchema.safeParse({ ...base, quantity: 0 }).success,
      false,
    );
  });

  it('rejects quantity above maximum', () => {
    assert.strictEqual(
      createRfqSchema.safeParse({ ...base, quantity: 100_001 }).success,
      false,
    );
  });

  it('rejects non-integer quantity', () => {
    // Zod coerce.number().int() should fail on decimals
    assert.strictEqual(
      createRfqSchema.safeParse({ ...base, quantity: 5.5 }).success,
      false,
    );
  });

  it('rejects missing destination', () => {
    assert.strictEqual(
      createRfqSchema.safeParse({ quantity: 10 }).success,
      false,
    );
  });

  it('rejects empty-string destination', () => {
    assert.strictEqual(
      createRfqSchema.safeParse({ quantity: 10, destination: '' }).success,
      false,
    );
  });

  it('rejects destination longer than 200 chars', () => {
    assert.strictEqual(
      createRfqSchema.safeParse({
        quantity: 10,
        destination: 'A'.repeat(201),
      }).success,
      false,
    );
  });

  it('rejects notes longer than 2000 chars', () => {
    assert.strictEqual(
      createRfqSchema.safeParse({
        ...base,
        notes: 'A'.repeat(2001),
      }).success,
      false,
    );
  });

  it('coerces empty-string productId and notes to null', () => {
    const result = createRfqSchema.safeParse({
      ...base,
      productId: '',
      notes: '',
      productDescription: 'Custom request',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.productId, null);
    assert.strictEqual(result.data.notes, null);
  });

  it('trims whitespace from destination', () => {
    const result = createRfqSchema.safeParse({
      quantity: 10,
      destination: '  Lagos, Nigeria  ',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.destination, 'Lagos, Nigeria');
  });
});

// ---------------------------------------------------------------------------
// rfqListQuerySchema
// ---------------------------------------------------------------------------

describe('rfqListQuerySchema — list query validation', () => {
  it('applies defaults when no params are provided', () => {
    const result = rfqListQuerySchema.safeParse({});
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.page, 1);
    assert.strictEqual(result.data.limit, RFQ_PAGE_SIZE_DEFAULT);
    assert.strictEqual(result.data.status, undefined);
  });

  it('coerces string page and limit', () => {
    const result = rfqListQuerySchema.safeParse({ page: '2', limit: '10' });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.page, 2);
    assert.strictEqual(result.data.limit, 10);
  });

  it('accepts a valid status filter', () => {
    for (const s of ['open', 'quoted', 'accepted', 'closed']) {
      const result = rfqListQuerySchema.safeParse({ status: s });
      assert.strictEqual(result.success, true, `should accept status=${s}`);
      assert.strictEqual(result.data.status, s);
    }
  });

  it('rejects an invalid status', () => {
    assert.strictEqual(
      rfqListQuerySchema.safeParse({ status: 'pending' }).success,
      false,
    );
  });

  it('rejects page below 1', () => {
    assert.strictEqual(
      rfqListQuerySchema.safeParse({ page: '0' }).success,
      false,
    );
  });

  it('rejects limit above maximum', () => {
    assert.strictEqual(
      rfqListQuerySchema.safeParse({ limit: '200' }).success,
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// rfqIdSchema
// ---------------------------------------------------------------------------

describe('rfqIdSchema — id param validation', () => {
  it('accepts a valid CUID-length id', () => {
    const result = rfqIdSchema.safeParse({ id: 'clyabc123xyz' });
    assert.strictEqual(result.success, true);
  });

  it('rejects an empty id', () => {
    assert.strictEqual(rfqIdSchema.safeParse({ id: '' }).success, false);
  });

  it('rejects a missing id', () => {
    assert.strictEqual(rfqIdSchema.safeParse({}).success, false);
  });
});

// ---------------------------------------------------------------------------
// CANCELLABLE_STATUSES
// ---------------------------------------------------------------------------

describe('CANCELLABLE_STATUSES constant', () => {
  it('only includes "open" as cancellable', () => {
    assert.ok(CANCELLABLE_STATUSES.includes('open'));
    assert.strictEqual(CANCELLABLE_STATUSES.includes('quoted'), false);
    assert.strictEqual(CANCELLABLE_STATUSES.includes('accepted'), false);
    assert.strictEqual(CANCELLABLE_STATUSES.includes('closed'), false);
  });
});

// ---------------------------------------------------------------------------
// RFQ reference number format
// ---------------------------------------------------------------------------

describe('RFQ_REF_PREFIX constant', () => {
  it('is "RFQ"', () => {
    assert.strictEqual(RFQ_REF_PREFIX, 'RFQ');
  });
});

// ---------------------------------------------------------------------------
// RFQ authorization policy
// ---------------------------------------------------------------------------

describe('RFQ authorization — buyer-only', () => {
  const buyer = { role: { code: 'buyer' } };
  const admin = { role: { code: 'admin' } };
  const guest = null;

  // API routes
  it('requires auth for GET /api/v1/rfqs', () => {
    const policy = getAuthorizationPolicy('/api/v1/rfqs');
    assert.strictEqual(policy.authRequired, true);
    assert.deepStrictEqual(policy.allowRoles, ['buyer']);
  });

  it('requires auth for POST /api/v1/rfqs', () => {
    assert.strictEqual(canAccessPath(guest, '/api/v1/rfqs'), false);
    assert.strictEqual(canAccessPath(buyer, '/api/v1/rfqs'), true);
    assert.strictEqual(canAccessPath(admin, '/api/v1/rfqs'), false);
  });

  it('requires auth for GET /api/v1/rfqs/:id', () => {
    const policy = getAuthorizationPolicy('/api/v1/rfqs/abc123');
    assert.strictEqual(policy.authRequired, true);
    assert.deepStrictEqual(policy.allowRoles, ['buyer']);
  });

  it('blocks guests from RFQ API', () => {
    assert.strictEqual(canAccessPath(guest, '/api/v1/rfqs/abc123'), false);
  });

  it('allows buyers to access RFQ API', () => {
    assert.strictEqual(canAccessPath(buyer, '/api/v1/rfqs/abc123'), true);
  });

  it('blocks admins from buyer RFQ API (role separation)', () => {
    assert.strictEqual(canAccessPath(admin, '/api/v1/rfqs/abc123'), false);
  });

  // Page routes
  it('requires buyer auth for /rfq page', () => {
    const policy = getAuthorizationPolicy('/rfq');
    assert.strictEqual(policy.authRequired, true);
    assert.ok(policy.allowRoles.includes('buyer'));
  });

  it('requires buyer auth for /rfq/new', () => {
    const policy = getAuthorizationPolicy('/rfq/new');
    assert.strictEqual(policy.authRequired, true);
    assert.ok(policy.allowRoles.includes('buyer'));
  });

  it('requires buyer auth for /rfq/:id', () => {
    const policy = getAuthorizationPolicy('/rfq/some-rfq-id');
    assert.strictEqual(policy.authRequired, true);
    assert.ok(policy.allowRoles.includes('buyer'));
  });

  it('does NOT break product catalogue (still public)', () => {
    assert.strictEqual(canAccessPath(guest, '/api/v1/products'), true);
    assert.strictEqual(canAccessPath(guest, '/api/v1/products/abc'), true);
    assert.strictEqual(canAccessPath(guest, '/api/v1/categories'), true);
  });

  it('does NOT weaken admin routes', () => {
    assert.strictEqual(canAccessPath(buyer, '/api/v1/admin/rfqs'), false);
    assert.strictEqual(canAccessPath(guest, '/api/v1/admin/rfqs'), false);
    assert.strictEqual(canAccessPath(admin, '/api/v1/admin/rfqs'), true);
  });
});

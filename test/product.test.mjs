import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  productListQuerySchema,
  resolveProductSort,
  PRODUCT_PAGE_SIZE_DEFAULT,
} from '../src/shared/validators/product.js';
import {
  canAccessPath,
  getAuthorizationPolicy,
} from '../src/shared/lib/authorization.js';
import { formatMoney } from '../src/shared/lib/money.js';
import { buildCatalogueQuery } from '../components/catalogue/catalogueParams.js';

describe('Product list query validation', () => {
  it('applies defaults when no params are provided', () => {
    const result = productListQuerySchema.safeParse({});
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.page, 1);
    assert.strictEqual(result.data.limit, PRODUCT_PAGE_SIZE_DEFAULT);
    assert.strictEqual(result.data.q, undefined);
    assert.strictEqual(result.data.categoryId, undefined);
  });

  it('coerces numeric page and limit from strings', () => {
    const result = productListQuerySchema.safeParse({ page: '3', limit: '50' });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.page, 3);
    assert.strictEqual(result.data.limit, 50);
  });

  it('treats empty-string params as absent (falls back to defaults)', () => {
    const result = productListQuerySchema.safeParse({
      q: '',
      categoryId: '',
      page: '',
      limit: '',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.page, 1);
    assert.strictEqual(result.data.limit, PRODUCT_PAGE_SIZE_DEFAULT);
    assert.strictEqual(result.data.q, undefined);
  });

  it('rejects a limit above the maximum', () => {
    const result = productListQuerySchema.safeParse({ limit: '500' });
    assert.strictEqual(result.success, false);
  });

  it('rejects a page below 1', () => {
    const result = productListQuerySchema.safeParse({ page: '0' });
    assert.strictEqual(result.success, false);
  });

  it('rejects a non-numeric page', () => {
    const result = productListQuerySchema.safeParse({ page: 'abc' });
    assert.strictEqual(result.success, false);
  });

  it('accepts a search term and category filter', () => {
    const result = productListQuerySchema.safeParse({
      q: 'earbuds',
      categoryId: 'clx123',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.q, 'earbuds');
    assert.strictEqual(result.data.categoryId, 'clx123');
  });
});

describe('Product sort resolution (whitelist)', () => {
  it('defaults to createdAt:desc when absent', () => {
    const sort = resolveProductSort(undefined);
    assert.deepStrictEqual(sort, { field: 'createdAt', direction: 'desc' });
  });

  it('accepts whitelisted field and direction', () => {
    assert.deepStrictEqual(resolveProductSort('price:asc'), {
      field: 'price',
      direction: 'asc',
    });
    assert.deepStrictEqual(resolveProductSort('title:desc'), {
      field: 'title',
      direction: 'desc',
    });
  });

  it('rejects a non-whitelisted field', () => {
    assert.strictEqual(resolveProductSort('supplierId:asc'), null);
    assert.strictEqual(resolveProductSort('price;drop:asc'), null);
  });

  it('rejects an invalid direction', () => {
    assert.strictEqual(resolveProductSort('price:sideways'), null);
    assert.strictEqual(resolveProductSort('price'), null);
  });
});

describe('Catalogue authorization (public reads, protected writes)', () => {
  const buyer = { role: { code: 'buyer' } };
  const admin = { role: { code: 'admin' } };

  it('exposes product list as public', () => {
    const policy = getAuthorizationPolicy('/api/v1/products');
    assert.strictEqual(policy.authRequired, false);
    assert.strictEqual(canAccessPath(null, '/api/v1/products'), true);
  });

  it('exposes product detail as public', () => {
    const policy = getAuthorizationPolicy('/api/v1/products/abc123');
    assert.strictEqual(policy.authRequired, false);
    assert.strictEqual(canAccessPath(null, '/api/v1/products/abc123'), true);
  });

  it('exposes categories as public', () => {
    const policy = getAuthorizationPolicy('/api/v1/categories');
    assert.strictEqual(policy.authRequired, false);
    assert.strictEqual(canAccessPath(null, '/api/v1/categories'), true);
  });

  it('does NOT weaken admin product management', () => {
    // Admin CRUD lives under /api/v1/admin/products — must stay admin-only and
    // must not be caught by the public products rule.
    const policy = getAuthorizationPolicy('/api/v1/admin/products');
    assert.strictEqual(policy.authRequired, true);
    assert.strictEqual(canAccessPath(null, '/api/v1/admin/products'), false);
    assert.strictEqual(canAccessPath(buyer, '/api/v1/admin/products'), false);
    assert.strictEqual(canAccessPath(admin, '/api/v1/admin/products'), true);
  });

  it('keeps other protected APIs unchanged', () => {
    assert.strictEqual(canAccessPath(null, '/api/v1/auth/me'), false);
    assert.strictEqual(canAccessPath(buyer, '/api/v1/customer/orders'), true);
    assert.strictEqual(canAccessPath(null, '/api/v1/customer/orders'), false);
    // Unknown authenticated API still requires auth by default.
    const unknown = getAuthorizationPolicy('/api/v1/something/new');
    assert.strictEqual(unknown.authRequired, true);
  });
});

describe('Money formatting (minor units)', () => {
  it('formats NGN minor units as naira', () => {
    // 4_500_000 kobo = ₦45,000.00
    const formatted = formatMoney(4_500_000, 'NGN');
    assert.ok(formatted.includes('45,000.00'));
  });

  it('defaults to NGN and handles nullish amounts', () => {
    const formatted = formatMoney(null);
    assert.ok(formatted.includes('0.00'));
  });
});

describe('Catalogue query builder', () => {
  it('sets and removes params', () => {
    assert.strictEqual(buildCatalogueQuery('', { q: 'phone' }), '?q=phone');
    assert.strictEqual(
      buildCatalogueQuery('q=phone&page=2', { page: null }),
      '?q=phone',
    );
  });

  it('drops empty values and returns empty string when no params', () => {
    assert.strictEqual(buildCatalogueQuery('', { q: '' }), '');
    assert.strictEqual(buildCatalogueQuery('q=phone', { q: null }), '');
  });

  it('overwrites existing values', () => {
    assert.strictEqual(buildCatalogueQuery('page=1', { page: 3 }), '?page=3');
  });
});

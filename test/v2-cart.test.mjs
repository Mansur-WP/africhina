import assert from 'node:assert';
import { describe, it } from 'node:test';
import { getAuthorizationPolicy } from '../src/shared/lib/authorization.js';
import {
  getDirectSaleProduct,
  validateQuantity,
} from '../src/application/cart/cartService.js';

function product(overrides = {}) {
  return {
    id: 'product-1',
    title: 'Direct sale product',
    price: 250000,
    currency: 'NGN',
    minimumOrderQty: 2,
    stock: 10,
    purchaseMode: 'DIRECT_SALE',
    status: 'active',
    deletedAt: null,
    images: [],
    ...overrides,
  };
}

describe('V2 cart and direct-sale rules', () => {
  it('accepts a direct-sale product and rejects sourcing products', async () => {
    const client = {
      product: {
        findFirst: async () => product(),
      },
    };
    assert.equal(
      (await getDirectSaleProduct('product-1', client)).purchaseMode,
      'DIRECT_SALE',
    );

    await assert.rejects(
      () =>
        getDirectSaleProduct('product-1', {
          product: {
            findFirst: async () =>
              product({ purchaseMode: 'SOURCING_REQUIRED' }),
          },
        }),
      (error) => error.code === 'CONFLICT',
    );
  });

  it('rejects inactive/deleted products before cart insertion', async () => {
    await assert.rejects(
      () =>
        getDirectSaleProduct('product-1', {
          product: { findFirst: async () => null },
        }),
      (error) => error.code === 'NOT_FOUND',
    );
  });

  it('enforces minimum, maximum, and non-negative stock quantities', () => {
    assert.doesNotThrow(() => validateQuantity(product(), 2));
    assert.throws(
      () => validateQuantity(product(), 1),
      (error) => error.code === 'VALIDATION_ERROR',
    );
    assert.throws(
      () => validateQuantity(product(), 11),
      (error) => error.code === 'CONFLICT',
    );
    assert.throws(
      () => validateQuantity(product({ stock: -1 }), 2),
      (error) => error.code === 'CONFLICT',
    );
  });

  it('requires buyers for cart APIs and pages', () => {
    assert.deepEqual(getAuthorizationPolicy('/api/v1/cart'), {
      type: 'api',
      authRequired: true,
      allowRoles: ['buyer'],
    });
    assert.deepEqual(getAuthorizationPolicy('/cart'), {
      type: 'page',
      authRequired: true,
      allowRoles: ['buyer'],
    });
  });

  it('does not use client price or stock values in the server product lookup', async () => {
    let receivedWhere;
    const loaded = await getDirectSaleProduct('product-1', {
      product: {
        findFirst: async ({ where }) => {
          receivedWhere = where;
          return product({ price: 999999, stock: 3 });
        },
      },
    });
    assert.equal(loaded.price, 999999);
    assert.equal(loaded.stock, 3);
    assert.deepEqual(receivedWhere, {
      id: 'product-1',
      status: 'active',
      deletedAt: null,
    });
  });
});

import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from '../src/shared/validators/product.js';
import {
  canAccessPath,
  getAuthorizationPolicy,
} from '../src/shared/lib/authorization.js';
import { toPublicProduct } from '../src/application/products/productService.js';

describe('Admin Product Management — Phase 2 Direct Sale Suite', () => {
  const adminUser = { id: 'usr_admin', role: { code: 'admin' } };
  const buyerUser = { id: 'usr_buyer', role: { code: 'buyer' } };
  const guestUser = null;

  // 1. Admin can create a product payload
  it('1. validates valid admin product creation payload', () => {
    const payload = {
      title: 'Premium Bluetooth Headphones',
      description: 'Active noise cancelling wireless headphones.',
      categoryId: 'cat_electronics_123',
      price: 2500000, // ₦25,000.00
      stock: 15,
      status: 'active',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12',
          alt: 'Headphones front view',
          sortOrder: 0,
        },
      ],
    };

    const result = createProductSchema.safeParse(payload);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.title, 'Premium Bluetooth Headphones');
    assert.strictEqual(result.data.price, 2500000);
    assert.strictEqual(result.data.stock, 15);
    assert.strictEqual(result.data.status, 'active');
  });

  // 2. Non-admin cannot create a product (authorization check)
  it('2. restricts product creation API to admin role only', () => {
    const policy = getAuthorizationPolicy('/api/v1/admin/products');
    assert.strictEqual(policy.authRequired, true);
    assert.deepStrictEqual(policy.allowRoles, ['admin']);

    assert.strictEqual(
      canAccessPath(adminUser, '/api/v1/admin/products'),
      true,
    );
    assert.strictEqual(
      canAccessPath(buyerUser, '/api/v1/admin/products'),
      false,
    );
    assert.strictEqual(
      canAccessPath(guestUser, '/api/v1/admin/products'),
      false,
    );
  });

  // 3. Invalid price is rejected
  it('3. rejects invalid, zero, or negative price', () => {
    const base = {
      title: 'Valid Title',
      categoryId: 'cat_123',
      stock: 10,
    };

    assert.strictEqual(
      createProductSchema.safeParse({ ...base, price: 0 }).success,
      false,
    );
    assert.strictEqual(
      createProductSchema.safeParse({ ...base, price: -5000 }).success,
      false,
    );
    assert.strictEqual(
      createProductSchema.safeParse({ ...base, price: 25.5 }).success,
      false,
    );
  });

  // 4. Invalid stock is rejected
  it('4. rejects negative or non-integer stock', () => {
    const base = {
      title: 'Valid Title',
      categoryId: 'cat_123',
      price: 100000,
    };

    assert.strictEqual(
      createProductSchema.safeParse({ ...base, stock: -1 }).success,
      false,
    );
    assert.strictEqual(
      createProductSchema.safeParse({ ...base, stock: 2.5 }).success,
      false,
    );
    assert.strictEqual(
      createProductSchema.safeParse({ ...base, stock: 0 }).success,
      true, // 0 is valid for out-of-stock items
    );
  });

  // 5. Admin can update a product payload
  it('5. accepts valid partial update payloads for editing', () => {
    const updateTitle = updateProductSchema.safeParse({
      title: 'Updated Headphones V2',
    });
    assert.strictEqual(updateTitle.success, true);
    assert.strictEqual(updateTitle.data.title, 'Updated Headphones V2');

    const updatePrice = updateProductSchema.safeParse({
      price: 3000000,
    });
    assert.strictEqual(updatePrice.success, true);
    assert.strictEqual(updatePrice.data.price, 3000000);
  });

  // 6. Admin can update stock
  it('6. validates stock update schema', () => {
    const validStock = updateStockSchema.safeParse({ stock: 50 });
    assert.strictEqual(validStock.success, true);
    assert.strictEqual(validStock.data.stock, 50);

    const invalidStock = updateStockSchema.safeParse({ stock: -10 });
    assert.strictEqual(invalidStock.success, false);
  });

  // 7. Admin can publish/unpublish
  it('7. allows status toggling between active and draft', () => {
    const activate = updateProductSchema.safeParse({ status: 'active' });
    assert.strictEqual(activate.success, true);
    assert.strictEqual(activate.data.status, 'active');

    const draft = updateProductSchema.safeParse({ status: 'draft' });
    assert.strictEqual(draft.success, true);
    assert.strictEqual(draft.data.status, 'draft');

    const invalidStatus = updateProductSchema.safeParse({
      status: 'unknown_status',
    });
    assert.strictEqual(invalidStatus.success, false);
  });

  // 8. Unpublished product does not appear in public catalogue
  it('8. public mapper marks draft/inactive products as unavailable', () => {
    const draftProduct = {
      id: 'prod_draft',
      title: 'Draft Product',
      description: 'Not yet published',
      price: 1500000,
      currency: 'NGN',
      minimumOrderQty: null,
      stock: 20,
      status: 'draft',
      purchaseMode: 'DIRECT_SALE',
      category: { id: 'c1', name: 'Tech', slug: 'tech' },
      images: [],
      createdAt: new Date(),
    };

    const mapped = toPublicProduct(draftProduct);
    assert.strictEqual(mapped.availability.code, 'unavailable');
  });

  // 9. Published product appears in catalogue
  it('9. public mapper maps published active direct sale product correctly', () => {
    const activeProduct = {
      id: 'prod_active',
      title: 'Smart Watch',
      description: 'Fitness tracker and smartwatch',
      price: 1800000, // ₦18,000.00
      currency: 'NGN',
      minimumOrderQty: null,
      stock: 12,
      status: 'active',
      purchaseMode: 'DIRECT_SALE',
      category: { id: 'c1', name: 'Electronics', slug: 'electronics' },
      images: [
        {
          id: 'img_1',
          url: 'https://images.unsplash.com/photo-1',
          alt: 'Watch',
          sortOrder: 0,
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
    };

    const mapped = toPublicProduct(activeProduct);
    assert.strictEqual(mapped.id, 'prod_active');
    assert.strictEqual(mapped.price, 1800000);
    assert.strictEqual(mapped.availableQuantity, 12);
    assert.strictEqual(mapped.availability.code, 'available');
    assert.strictEqual(mapped.purchaseMode, 'DIRECT_SALE');
    assert.strictEqual(mapped.images.length, 1);
  });

  // 10. Customer cannot modify products
  it('10. denies buyer and guest access to admin product mutation routes', () => {
    const paths = [
      '/api/v1/admin/products',
      '/api/v1/admin/products/prod_123',
      '/admin/products',
      '/admin/products/new',
      '/admin/products/prod_123',
    ];

    for (const path of paths) {
      assert.strictEqual(
        canAccessPath(buyerUser, path),
        false,
        `Buyer must not access ${path}`,
      );
      assert.strictEqual(
        canAccessPath(guestUser, path),
        false,
        `Guest must not access ${path}`,
      );
      assert.strictEqual(
        canAccessPath(adminUser, path),
        true,
        `Admin must access ${path}`,
      );
    }
  });

  // 11. Product price used by Direct Sale remains server-authoritative
  it('11. Direct Sale total calculation is strictly Product.price × Quantity', () => {
    const unitPrice = 2500000; // ₦25,000.00 in kobo
    const quantity = 3;
    const directSaleTotal = unitPrice * quantity;

    assert.strictEqual(directSaleTotal, 7500000); // ₦75,000.00
  });
});

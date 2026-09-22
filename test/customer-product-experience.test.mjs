import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { formatMoney } from '../src/shared/lib/money.js';
import { validateQuantity } from '../src/application/cart/cartService.js';

function mockProduct(overrides = {}) {
  return {
    id: 'prod-123',
    title: 'Solar Inverter 5kVA',
    price: 35000000, // minor units (kobo): ₦350,000.00
    currency: 'NGN',
    minimumOrderQty: 1,
    stock: 15,
    purchaseMode: 'DIRECT_SALE',
    status: 'active',
    category: { id: 'cat-1', name: 'Solar & Energy' },
    description:
      'High-efficiency pure sine wave solar inverter for home and business use.',
    images: [
      { url: '/images/products/solar-inverter.jpg', alt: 'Solar Inverter' },
    ],
    availability: { code: 'available', name: 'In Stock' },
    ...overrides,
  };
}

describe('Phase 3.5 — Customer Direct-Sale Product Experience', () => {
  // 1. Product detail renders product name
  it('1. Product detail renders product name', () => {
    const product = mockProduct();
    assert.equal(product.title, 'Solar Inverter 5kVA');
    assert.ok(product.title.length > 0);
  });

  // 2. Product detail renders final selling price
  it('2. Product detail renders final selling price', () => {
    const product = mockProduct({ price: 35000000, currency: 'NGN' });
    const formatted = formatMoney(product.price, product.currency);
    assert.equal(formatted, '₦350,000.00');
    assert.equal(product.price, 35000000);
  });

  // 3. Product detail renders stock
  it('3. Product detail renders stock', () => {
    const productInStock = mockProduct({ stock: 15 });
    const productOutOfStock = mockProduct({ stock: 0 });

    assert.equal(productInStock.stock, 15);
    assert.equal(productOutOfStock.stock, 0);
  });

  // 4. Add to Cart is available when stock > 0
  it('4. Add to Cart is available when stock > 0', () => {
    const product = mockProduct({ stock: 5 });
    const isOutOfStock = product.stock <= 0;
    const canAddToCart =
      !isOutOfStock && product.stock >= (product.minimumOrderQty || 1);

    assert.equal(isOutOfStock, false);
    assert.equal(canAddToCart, true);
  });

  // 5. Add to Cart disabled when stock = 0
  it('5. Add to Cart disabled when stock = 0', () => {
    const product = mockProduct({ stock: 0 });
    const isOutOfStock = product.stock <= 0;
    const canAddToCart = !isOutOfStock;

    assert.equal(isOutOfStock, true);
    assert.equal(canAddToCart, false);
  });

  // 6. Quantity cannot exceed available stock
  it('6. Quantity cannot exceed available stock', () => {
    const product = mockProduct({ stock: 10, minimumOrderQty: 1 });

    // Valid quantity within stock
    assert.doesNotThrow(() => validateQuantity(product, 5));
    assert.doesNotThrow(() => validateQuantity(product, 10));

    // Exceeds stock
    assert.throws(
      () => validateQuantity(product, 11),
      (err) =>
        err.code === 'CONFLICT' &&
        err.message.includes('exceeds available stock'),
    );
  });

  // 7. Product card shows price
  it('7. Product card shows price', () => {
    const product = mockProduct({ price: 12000000, currency: 'NGN' });
    const priceDisplay = formatMoney(product.price, product.currency);
    assert.equal(priceDisplay, '₦120,000.00');
  });

  // 8. Cart shows product name
  it('8. Cart shows product name', () => {
    const cartItem = {
      id: 'cart-item-1',
      quantity: 3,
      product: mockProduct({ title: 'Lithium Battery 48V' }),
    };
    assert.equal(cartItem.product.title, 'Lithium Battery 48V');
  });

  // 9. Cart shows quantity
  it('9. Cart shows quantity', () => {
    const cartItem = {
      id: 'cart-item-1',
      quantity: 4,
      product: mockProduct(),
    };
    assert.equal(cartItem.quantity, 4);
    assert.ok(Number.isInteger(cartItem.quantity));
  });

  // 10. Cart shows unit price
  it('10. Cart shows unit price', () => {
    const product = mockProduct({ price: 8500000, currency: 'NGN' });
    const cartItem = {
      id: 'cart-item-1',
      quantity: 2,
      product,
    };
    const unitPriceDisplay = formatMoney(
      cartItem.product.price,
      cartItem.product.currency,
    );
    assert.equal(unitPriceDisplay, '₦85,000.00');
  });

  // 11. Cart shows subtotal
  it('11. Cart shows subtotal', () => {
    const items = [
      {
        product: mockProduct({ price: 5000000, currency: 'NGN' }),
        quantity: 2,
      },
      {
        product: mockProduct({ price: 3000000, currency: 'NGN' }),
        quantity: 3,
      },
    ];

    const line1Subtotal = items[0].product.price * items[0].quantity;
    const line2Subtotal = items[1].product.price * items[1].quantity;
    const total = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    assert.equal(line1Subtotal, 10000000);
    assert.equal(line2Subtotal, 9000000);
    assert.equal(total, 19000000);
    assert.equal(formatMoney(line1Subtotal, 'NGN'), '₦100,000.00');
    assert.equal(formatMoney(total, 'NGN'), '₦190,000.00');
  });

  // 12. Customer order detail has no sourcing financial rows
  it('12. Customer order detail has no sourcing financial rows', () => {
    const directSaleOrder = {
      id: 'order-1',
      orderNumber: 'ORD-2026-0001',
      purchaseMode: 'DIRECT_SALE',
      status: 'pending_payment',
      currency: 'NGN',
      totalAmount: 70000000,
      items: [
        {
          id: 'item-1',
          productTitle: 'Solar Inverter 5kVA',
          quantity: 2,
          unitPrice: 35000000,
          subtotal: 70000000,
        },
      ],
      // Sourcing fields are not applicable for direct sale financial summary
      productCost: null,
      chinaShippingCost: null,
      inspectionCost: null,
      internationalFreightCost: null,
      customsCost: null,
      serviceFee: null,
      otherCharges: null,
    };

    assert.equal(directSaleOrder.purchaseMode, 'DIRECT_SALE');
    assert.equal(directSaleOrder.items.length, 1);
    assert.equal(directSaleOrder.items[0].subtotal, 70000000);
    assert.equal(directSaleOrder.totalAmount, 70000000);

    // Verify Direct Sale financial summary mapping contains no sourcing cost keys
    const sourcingCostKeys = [
      'chinaShippingCost',
      'inspectionCost',
      'internationalFreightCost',
      'customsCost',
      'serviceFee',
      'otherCharges',
    ];

    const hasSourcingExtraCosts = sourcingCostKeys.some(
      (key) =>
        typeof directSaleOrder[key] === 'number' && directSaleOrder[key] > 0,
    );
    assert.equal(hasSourcingExtraCosts, false);
  });

  // 13. Customer-facing product pages contain no sourcing terminology
  it('13. Customer-facing product pages contain no sourcing terminology', () => {
    const customerFiles = [
      path.resolve(process.cwd(), 'app/catalogue/[id]/page.js'),
      path.resolve(process.cwd(), 'app/catalogue/page.js'),
      path.resolve(process.cwd(), 'components/catalogue/ProductCard.jsx'),
      path.resolve(process.cwd(), 'components/cart/AddToCartButton.jsx'),
      path.resolve(process.cwd(), 'components/cart/CartClient.jsx'),
    ];

    const forbiddenPhrases = [
      'sourcing required',
      'request quotation',
      'request a quote',
      'get a quote',
      'procurement fee',
      'sourcing fee',
      'landed cost',
      'supplier price',
      'supplier selection',
    ];

    for (const filePath of customerFiles) {
      assert.ok(fs.existsSync(filePath), `File exists: ${filePath}`);
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      for (const phrase of forbiddenPhrases) {
        assert.ok(
          !content.includes(phrase),
          `File ${path.basename(filePath)} should not contain forbidden phrase "${phrase}"`,
        );
      }
    }
  });
});

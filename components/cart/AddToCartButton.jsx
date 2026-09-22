'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Minus, Loader2, AlertCircle } from 'lucide-react';
import { formatMoney } from '@/src/shared/lib/money.js';

export default function AddToCartButton({ product }) {
  const router = useRouter();
  const availableStock =
    typeof product.stock === 'number'
      ? product.stock
      : typeof product.availableQuantity === 'number'
        ? product.availableQuantity
        : 0;

  const isOutOfStock = availableStock <= 0;
  const minQty = product.minimumOrderQty || 1;
  const initialQty = isOutOfStock ? 0 : Math.min(minQty, availableStock);

  const [quantity, setQuantity] = useState(initialQty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function handleQuantityChange(nextVal) {
    if (isOutOfStock) return;
    setError('');
    const parsed = parseInt(nextVal, 10);
    if (isNaN(parsed) || parsed < 1) {
      setQuantity(1);
      return;
    }
    if (parsed > availableStock) {
      setQuantity(availableStock);
      setError(`Maximum available stock is ${availableStock} units.`);
      return;
    }
    setQuantity(parsed);
  }

  function increment() {
    if (quantity < availableStock) {
      handleQuantityChange(quantity + 1);
    } else {
      setError(
        `Cannot add more than available stock (${availableStock} units).`,
      );
    }
  }

  function decrement() {
    if (quantity > 1) {
      handleQuantityChange(quantity - 1);
    }
  }

  async function addToCart() {
    if (isOutOfStock) return;
    if (quantity > availableStock) {
      setError(
        `Selected quantity exceeds available stock (${availableStock}).`,
      );
      return;
    }

    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/v1/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          payload?.error?.message ||
            payload?.message ||
            'Unable to add item to cart.',
        );
      }
      router.push('/cart');
    } catch (submitError) {
      setError(submitError.message);
      setBusy(false);
    }
  }

  if (isOutOfStock) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-muted px-6 py-3.5 text-sm font-semibold text-muted-foreground shadow-xs sm:w-auto"
        >
          <ShoppingCart size={16} />
          <span>Out of Stock</span>
        </button>
        <p className="text-xs text-muted-foreground">
          This item is currently out of stock. Please check back later.
        </p>
      </div>
    );
  }

  const subtotal = product.price * quantity;

  return (
    <div className="flex w-full flex-col gap-3 sm:max-w-md">
      <div className="flex flex-wrap items-center gap-4">
        {/* Quantity Controls */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="product-quantity"
            className="text-xs font-semibold text-muted-foreground"
          >
            Quantity
          </label>
          <div className="flex h-11 items-center rounded-lg border border-border bg-card shadow-xs">
            <button
              type="button"
              onClick={decrement}
              disabled={quantity <= 1 || busy}
              className="flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <input
              id="product-quantity"
              type="number"
              min={1}
              max={availableStock}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              disabled={busy}
              className="h-full w-14 border-x border-border bg-transparent text-center text-sm font-semibold text-foreground focus:outline-none"
            />
            <button
              type="button"
              onClick={increment}
              disabled={quantity >= availableStock || busy}
              className="flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Subtotal preview if qty > 1 */}
        {quantity > 1 ? (
          <div className="flex flex-col gap-1 pt-4 sm:pt-0">
            <span className="text-xs font-semibold text-muted-foreground">
              Subtotal
            </span>
            <span className="text-sm font-bold text-foreground tabular-nums">
              {formatMoney(subtotal, product.currency)}
            </span>
          </div>
        ) : null}
      </div>

      {/* Add to Cart CTA Button */}
      <button
        type="button"
        onClick={addToCart}
        disabled={busy || quantity <= 0}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {busy ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Adding to Cart…</span>
          </>
        ) : (
          <>
            <ShoppingCart size={16} />
            <span>Add to Cart</span>
          </>
        )}
      </button>

      {/* Stock note */}
      <p className="text-[11px] text-muted-foreground">
        ✓ {availableStock} unit{availableStock !== 1 ? 's' : ''} available for
        immediate purchase.
      </p>

      {/* Error display */}
      {error ? (
        <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}

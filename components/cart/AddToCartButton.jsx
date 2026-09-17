'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddToCartButton({ product }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(product.minimumOrderQty || 1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function addToCart() {
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
        throw new Error(payload?.error?.message || 'Unable to add to cart.');
      }
      router.push('/cart');
    } catch (submitError) {
      setError(submitError.message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor="product-quantity" className="text-sm font-medium">
          Quantity
        </label>
        <input
          id="product-quantity"
          type="number"
          min={product.minimumOrderQty || 1}
          max={product.stock}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          className="w-24 rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={addToCart}
        disabled={busy}
        className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {busy ? 'Adding...' : 'Add to cart'}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

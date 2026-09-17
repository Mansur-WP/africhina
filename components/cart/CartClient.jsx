'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney } from '@/src/shared/lib/money.js';

export default function CartClient({ initialCart }) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [destination, setDestination] = useState('Kano, Nigeria');
  const [busyId, setBusyId] = useState(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [error, setError] = useState('');

  const total = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const currency = cart.items[0]?.product.currency || 'NGN';

  async function updateItem(itemId, quantity) {
    setBusyId(itemId);
    setError('');
    try {
      const response = await fetch(`/api/v1/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Number(quantity) }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload?.error?.message || 'Unable to update cart.');
      setCart(payload.data);
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(itemId) {
    setBusyId(itemId);
    setError('');
    try {
      const response = await fetch(`/api/v1/cart/${itemId}`, {
        method: 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload?.error?.message || 'Unable to remove item.');
      setCart(payload.data);
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setBusyId(null);
    }
  }

  async function checkout() {
    setCheckoutBusy(true);
    setError('');
    try {
      const response = await fetch('/api/v1/orders/direct-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload?.error?.message || 'Unable to prepare checkout.',
        );
      router.push(`/checkout/${payload.data.id}`);
    } catch (checkoutError) {
      setError(checkoutError.message);
      setCheckoutBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="flex flex-col gap-3">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className="min-w-0">
              <p className="font-semibold">{item.product.title}</p>
              <p className="text-sm text-muted-foreground">
                {formatMoney(item.product.price, item.product.currency)} each
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                aria-label={`Quantity for ${item.product.title}`}
                type="number"
                min={item.product.minimumOrderQty || 1}
                max={item.product.stock}
                defaultValue={item.quantity}
                disabled={busyId === item.id}
                onBlur={(event) => {
                  const next = Number(event.target.value);
                  if (next !== item.quantity) updateItem(item.id, next);
                }}
                className="w-20 rounded-md border border-border px-2 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                disabled={busyId === item.id}
                className="text-sm font-semibold text-red-700 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </section>
      <aside className="flex h-fit flex-col gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <p className="text-sm text-muted-foreground">Order total</p>
          <p className="text-2xl font-bold">{formatMoney(total, currency)}</p>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Delivery destination
          <input
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal"
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="button"
          onClick={checkout}
          disabled={checkoutBusy || !cart.items.length}
          className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {checkoutBusy ? 'Preparing...' : 'Proceed to checkout'}
        </button>
        <p className="text-xs text-muted-foreground">
          🔒 Secure Paystack payment on next step.
        </p>
      </aside>
    </div>
  );
}

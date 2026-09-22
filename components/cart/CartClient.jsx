'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Minus,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { formatMoney } from '@/src/shared/lib/money.js';

const PLACEHOLDER_IMAGE = '/images/products/placeholder.svg';

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

  async function updateItem(itemId, nextQty) {
    const parsed = Number(nextQty);
    if (isNaN(parsed) || parsed < 1) return;
    setBusyId(itemId);
    setError('');
    try {
      const response = await fetch(`/api/v1/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: parsed }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          payload?.error?.message ||
            payload?.message ||
            'Unable to update cart.',
        );
      }
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
      if (!response.ok) {
        throw new Error(
          payload?.error?.message ||
            payload?.message ||
            'Unable to remove item.',
        );
      }
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
      if (!response.ok) {
        throw new Error(
          payload?.error?.message ||
            payload?.message ||
            'Unable to prepare checkout.',
        );
      }
      router.push(`/checkout/${payload.data.id}`);
    } catch (checkoutError) {
      setError(checkoutError.message);
      setCheckoutBusy(false);
    }
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
        <Package size={36} className="text-muted-foreground/40" />
        <div>
          <p className="text-base font-semibold text-foreground">
            Your cart is empty
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Explore our product catalogue to find direct-sale products.
          </p>
        </div>
        <Link
          href="/catalogue"
          className="mt-2 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Browse Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Items Section */}
      <section className="flex flex-col gap-4">
        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-xs">
          {cart.items.map((item) => {
            const isBusy = busyId === item.id;
            const imageUrl = item.product.image?.url || PLACEHOLDER_IMAGE;
            const lineSubtotal = item.product.price * item.quantity;
            const maxStock =
              typeof item.product.stock === 'number'
                ? item.product.stock
                : 9999;
            const minQty = item.product.minimumOrderQty || 1;

            return (
              <div
                key={item.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Product Thumbnail & Details */}
                <div className="flex min-w-0 items-center gap-4">
                  <Link
                    href={`/catalogue/${item.product.id}`}
                    className="relative flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 transition hover:opacity-90"
                  >
                    <Image
                      src={imageUrl}
                      alt={item.product.image?.alt || item.product.title}
                      fill
                      className="object-cover"
                      unoptimized={imageUrl.endsWith('.svg')}
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/catalogue/${item.product.id}`}
                      className="line-clamp-2 text-sm font-bold text-foreground transition hover:text-primary"
                    >
                      {item.product.title}
                    </Link>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground tabular-nums">
                      {formatMoney(item.product.price, item.product.currency)}{' '}
                      <span className="text-[11px] font-normal">each</span>
                    </p>
                    {item.product.stock > 0 && (
                      <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                        ✓ In Stock ({item.product.stock} available)
                      </p>
                    )}
                  </div>
                </div>

                {/* Quantity Controls & Line Subtotal */}
                <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                  {/* Stepper */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 items-center rounded-lg border border-border bg-background shadow-2xs">
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        disabled={isBusy || item.quantity <= minQty}
                        className="flex h-full w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                        aria-label={`Decrease quantity for ${item.product.title}`}
                      >
                        <Minus size={13} />
                      </button>
                      <input
                        aria-label={`Quantity for ${item.product.title}`}
                        type="number"
                        min={minQty}
                        max={maxStock}
                        value={item.quantity}
                        disabled={isBusy}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= maxStock) {
                            updateItem(item.id, val);
                          }
                        }}
                        className="h-full w-12 border-x border-border bg-transparent text-center text-xs font-bold text-foreground focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={isBusy || item.quantity >= maxStock}
                        className="flex h-full w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                        aria-label={`Increase quantity for ${item.product.title}`}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={isBusy}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                      aria-label={`Remove ${item.product.title} from cart`}
                    >
                      {isBusy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>

                  {/* Line Subtotal */}
                  <div className="min-w-[90px] text-right">
                    <span className="block text-sm font-bold text-foreground tabular-nums">
                      {formatMoney(lineSubtotal, item.product.currency)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      Line subtotal
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cart Summary Aside */}
      <aside className="flex h-fit flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-xs">
        <h2 className="text-base font-bold text-foreground">Order Summary</h2>

        <dl className="flex flex-col gap-2.5 border-b border-border pb-4 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <dt>Subtotal</dt>
            <dd className="font-semibold text-foreground tabular-nums">
              {formatMoney(total, currency)}
            </dd>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <dt>Shipping / Processing</dt>
            <dd className="font-medium text-emerald-600 dark:text-emerald-400">
              Calculated at checkout
            </dd>
          </div>
        </dl>

        <div className="flex items-baseline justify-between text-sm font-bold text-foreground">
          <span>Total</span>
          <span className="text-2xl font-extrabold tracking-tight tabular-nums">
            {formatMoney(total, currency)}
          </span>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground">
          <span>Delivery Destination</span>
          <input
            type="text"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="e.g. Kano, Nigeria"
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <button
          type="button"
          onClick={checkout}
          disabled={checkoutBusy || !cart.items.length}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {checkoutBusy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Preparing Order…</span>
            </>
          ) : (
            <span>Proceed to Checkout</span>
          )}
        </button>

        <p className="text-center text-[11px] text-muted-foreground">
          🔒 Secure payment via Paystack on next step.
        </p>
      </aside>
    </div>
  );
}

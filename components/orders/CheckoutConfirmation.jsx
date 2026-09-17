'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney } from '@/src/shared/lib/money.js';

export default function CheckoutConfirmation({ order }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function confirm() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/orders/${order.id}/checkout`, {
        method: 'POST',
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload?.error?.message || 'Unable to confirm checkout.',
        );
      router.push(`/orders/${order.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
      setBusy(false);
    }
  }
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">Total to be paid</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {formatMoney(order.totalAmount, order.currency)}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        By confirming this order, you are proceeding to payment. No payment
        details are collected here.
      </p>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        onClick={confirm}
        disabled={busy || order.status !== 'draft'}
        className="mt-5 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {busy
          ? 'Confirming...'
          : order.status === 'draft'
            ? 'Confirm and proceed to payment'
            : 'Payment pending'}
      </button>
    </section>
  );
}

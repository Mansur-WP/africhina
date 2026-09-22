'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney } from '@/src/shared/lib/money.js';

function generateIdempotencyKey(orderId) {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `pay-${orderId}-${crypto.randomUUID()}`;
  }
  return `pay-${orderId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function CheckoutConfirmation({ order }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');

  async function payWithPaystack() {
    setBusy(true);
    setError('');
    setStatusText('Preparing payment...');

    try {
      // Initialize Paystack payment directly
      setStatusText('Connecting to Paystack...');
      const idempotencyKey = generateIdempotencyKey(order.id);

      const response = await fetch('/api/v1/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          idempotencyKey,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error?.message ||
            payload?.message ||
            'Unable to initialize payment.',
        );
      }

      const authorizationUrl = payload?.data?.authorizationUrl;
      if (!authorizationUrl) {
        throw new Error(
          'Payment provider did not return an authorization URL.',
        );
      }

      setStatusText('Redirecting to Paystack...');
      // 3. Redirect to Paystack's hosted checkout page
      window.location.href = authorizationUrl;
    } catch (paymentError) {
      setError(paymentError.message || 'Payment initialization failed.');
      setBusy(false);
      setStatusText('');
    }
  }

  const isPayable =
    order.status === 'draft' || order.status === 'pending_payment';

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div>
        <h2 className="text-base font-bold text-foreground">Payment Summary</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Complete your order securely with Paystack.
        </p>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Total to be paid
        </p>
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
          {formatMoney(order.totalAmount, order.currency)}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>Paystack Checkout (Cards, Bank Transfer, USSD)</span>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <p className="font-semibold">Payment failed</p>
          <p className="mt-0.5">{error}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={payWithPaystack}
          disabled={busy || !isPayable}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? (
            <>
              <svg
                className="h-4 w-4 animate-spin text-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>{statusText || 'Processing...'}</span>
            </>
          ) : (
            <span>
              {order.status === 'draft'
                ? 'Confirm & Pay with Paystack'
                : 'Pay with Paystack'}
            </span>
          )}
        </button>

        <p className="text-center text-[11px] text-muted-foreground">
          🔒 Secured by 256-bit encryption via Paystack
        </p>
      </div>
    </section>
  );
}

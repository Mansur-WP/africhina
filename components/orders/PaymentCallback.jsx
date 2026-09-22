'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/src/shared/lib/money.js';

export default function PaymentCallback({ initialOrder, reference }) {
  const [order, setOrder] = useState(initialOrder);
  const [state, setState] = useState(
    initialOrder.status === 'paid' ? 'success' : 'loading',
  );
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialOrder.status === 'paid') {
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        const res = await fetch('/api/v1/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: initialOrder.id,
            reference: reference || undefined,
          }),
        });

        const payload = await res.json();

        if (!isMounted) return;

        if (
          res.ok &&
          (payload?.data?.order?.status === 'paid' ||
            payload?.data?.payment?.status === 'VERIFIED')
        ) {
          setState('success');
          setOrder((prev) => ({
            ...prev,
            status: payload.data.order?.status || 'paid',
          }));
        } else if (payload?.error?.code === 'PAYMENT_PROVIDER_UNAVAILABLE') {
          setState('pending');
        } else {
          setState('failed');
          setErrorMessage(
            payload?.error?.message ||
              payload?.message ||
              'Payment could not be verified.',
          );
        }
      } catch {
        if (isMounted) {
          setState('pending');
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [initialOrder.id, initialOrder.status, reference]);

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center">
      {state === 'loading' && (
        <>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <svg
              className="h-8 w-8 animate-spin"
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
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Verifying Payment...
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Please wait while we authoritatively verify your payment with
            Paystack.
          </p>
        </>
      )}

      {state === 'success' && (
        <>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Payment Confirmed!
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your payment for order{' '}
            <span className="font-mono font-semibold text-foreground">
              {order.orderNumber}
            </span>{' '}
            has been verified and confirmed.
          </p>
        </>
      )}

      {state === 'failed' && (
        <>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Payment Verification Failed
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-red-600 dark:text-red-400">
            {errorMessage || 'The payment could not be confirmed.'}
          </p>
        </>
      )}

      {state === 'pending' && (
        <>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Payment Processing
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We are awaiting provider confirmation. Your order status will update
            once Paystack confirms settlement.
          </p>
        </>
      )}

      <div className="mt-6 rounded-xl border border-border bg-card p-5 text-left text-sm shadow-sm">
        <div className="flex justify-between border-b border-border py-2">
          <span className="text-muted-foreground">Order Reference</span>
          <span className="font-mono font-semibold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between border-b border-border py-2">
          <span className="text-muted-foreground">Total Amount</span>
          <span className="font-bold tabular-nums">
            {formatMoney(order.totalAmount, order.currency)}
          </span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-muted-foreground">Order Status</span>
          <span
            className={`font-semibold capitalize ${
              order.status === 'paid'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {order.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href={`/orders/${order.id}`}
          className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:w-auto"
        >
          View Order Details
        </Link>
        <Link
          href="/orders"
          className="w-full rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:w-auto"
        >
          Back to All Orders
        </Link>
      </div>
    </div>
  );
}

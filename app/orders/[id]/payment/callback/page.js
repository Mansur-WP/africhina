import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { getCustomerOrder } from '@/src/application/orders/orderService.js';
import { formatMoney } from '@/src/shared/lib/money.js';

export default async function PaymentCallbackPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/403');
  const order = await getCustomerOrder((await params).id, user.id);
  if (!order) notFound();

  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
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
          Payment Return Received
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your payment attempt for order{' '}
          <span className="font-mono font-semibold text-foreground">
            {order.orderNumber}
          </span>{' '}
          has been received from Paystack.
        </p>

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
            <span className="font-medium text-amber-600 capitalize dark:text-amber-400">
              {order.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Note: Payment confirmation is authoritatively verified via secure
          backend processing. Your order status will update upon provider
          verification.
        </p>

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
    </AppShell>
  );
}

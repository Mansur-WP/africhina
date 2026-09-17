import Link from 'next/link';
import EmptyState from '@/components/EmptyState.jsx';
import { formatMoney } from '@/src/shared/lib/money.js';

const STATUS_CONFIG = {
  pending_payment: {
    label: 'Payment Required',
    className:
      'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  draft: {
    label: 'Draft Review',
    className:
      'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  paid: {
    label: 'Confirmed',
    className:
      'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  in_progress: {
    label: 'Preparing',
    className:
      'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  },
  shipped: {
    label: 'Shipped',
    className:
      'text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  },
  delivered: {
    label: 'Delivered',
    className:
      'text-green-700 bg-green-50 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  },
  cancelled: {
    label: 'Cancelled',
    className:
      'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  },
};

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function OrderList({ orders, admin = false }) {
  if (!orders?.length) {
    return (
      <EmptyState
        title="No orders yet"
        description="Your direct-sale purchases and accepted sourcing offers will appear here for tracking and payment."
        action={
          !admin ? (
            <Link
              href="/catalogue"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Browse Products
            </Link>
          ) : null
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => {
        const statusMeta = STATUS_CONFIG[order.status] ?? {
          label: order.status.replace('_', ' '),
          className: 'text-gray-600 bg-gray-50 border-gray-200',
        };
        const firstItemTitle =
          order.items[0]?.productTitle ||
          order.items[0]?.product?.title ||
          (order.purchaseMode === 'DIRECT_SALE'
            ? 'Direct purchase'
            : 'Custom sourcing order');
        const itemCount = order.items?.length ?? 0;
        const isPending =
          order.status === 'pending_payment' || order.status === 'draft';
        const targetPath = `${admin ? '/admin/orders' : '/orders'}/${order.id}`;

        return (
          <Link
            key={order.id}
            href={!admin && isPending ? `/checkout/${order.id}` : targetPath}
            className="grid gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm sm:grid-cols-[1.3fr_1.2fr_1fr_auto] sm:items-center"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs font-bold text-foreground">
                  {order.orderNumber}
                </p>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {order.purchaseMode === 'DIRECT_SALE' ? 'Direct' : 'Import'}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {order.quotation
                  ? `Offer ${order.quotation.referenceNumber || order.quotationId}`
                  : `Placed ${formatDate(order.createdAt)}`}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Item{itemCount > 1 ? 's' : ''}
              </p>
              <p className="truncate text-sm font-medium text-foreground">
                {firstItemTitle}
                {itemCount > 1 ? ` + ${itemCount - 1} more` : ''}
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-foreground tabular-nums">
                {formatMoney(order.totalAmount, order.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
              {!admin && isPending ? (
                <span className="text-xs font-semibold text-primary">
                  Pay Now →
                </span>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

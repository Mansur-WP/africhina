import Link from 'next/link';
import EmptyState from '@/components/EmptyState.jsx';
import { formatMoney } from '@/src/shared/lib/money.js';

function formatDate(value) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function OrderList({ orders, admin = false }) {
  if (!orders.length) {
    return (
      <EmptyState
        title="No orders yet"
        description="Accepted quotations will appear here as orders ready for review."
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`${admin ? '/admin/orders' : '/orders'}/${order.id}`}
          className="grid gap-3 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center"
        >
          <div>
            <p className="font-mono text-sm font-semibold">
              {order.orderNumber}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Quotation {order.quotation?.referenceNumber || order.quotationId}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Item</p>
            <p className="truncate text-sm font-medium">
              {order.items[0]?.product?.title || 'Custom sourcing order'}
            </p>
          </div>
          <div>
            <p className="font-semibold tabular-nums">
              {formatMoney(order.totalAmount, order.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <span className="text-sm font-semibold text-primary capitalize">
            {order.status.replace('_', ' ')}
          </span>
        </Link>
      ))}
    </div>
  );
}

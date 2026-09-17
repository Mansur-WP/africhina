import Link from 'next/link';
import { formatMoney } from '@/src/shared/lib/money.js';

const COSTS = [
  ['Product cost', 'productCost'],
  ['China domestic shipping', 'chinaShippingCost'],
  ['Inspection', 'inspectionCost'],
  ['International freight', 'internationalFreightCost'],
  ['Customs / clearance', 'customsCost'],
  ['Service fee', 'serviceFee'],
  ['Other charges', 'otherCharges'],
];

function formatDate(value) {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function OrderDetail({ order, admin = false }) {
  const checkoutPath = `/checkout/${order.id}`;
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Link
        href={admin ? '/admin/orders' : '/orders'}
        className="text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        ← Back to Orders
      </Link>
      <header className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-sm text-muted-foreground">
            {order.orderNumber}
          </p>
          <h1 className="mt-1 text-2xl font-bold">Order review</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quotation {order.quotation?.referenceNumber || order.quotationId} ·{' '}
            {formatDate(order.createdAt)}
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold capitalize">
          {order.status.replace('_', ' ')}
        </span>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold">Items</h2>
            <div className="mt-4 divide-y divide-border">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 py-3 text-sm"
                >
                  <span>
                    {item.product?.title || 'Custom sourcing item'} ×{' '}
                    {item.quantity}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(item.subtotal, order.currency)}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold">Financial breakdown</h2>
            <dl className="mt-4 divide-y divide-border">
              {COSTS.map(([label, key]) => (
                <div
                  key={key}
                  className="flex justify-between gap-4 py-3 text-sm"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="tabular-nums">
                    {formatMoney(order[key], order.currency)}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 pt-4 text-base font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  {formatMoney(order.totalAmount, order.currency)}
                </dd>
              </div>
            </dl>
          </section>
        </div>
        <aside className="flex h-fit flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <div>
            <p className="text-xs text-muted-foreground">Customer</p>
            <p className="mt-1 text-sm font-semibold">
              {order.buyer?.name || order.buyer?.email}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.buyer?.email}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Payment state</p>
            <p className="mt-1 text-sm font-semibold capitalize">
              {order.paymentStatus || 'Awaiting checkout'}
            </p>
          </div>
          {!admin && order.status === 'draft' ? (
            <Link
              href={checkoutPath}
              className="rounded-md bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              Proceed to checkout
            </Link>
          ) : null}
          {!admin && order.status === 'pending_payment' ? (
            <p className="text-sm text-amber-700">
              Payment is pending. Payment processing will be available in a
              later milestone.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

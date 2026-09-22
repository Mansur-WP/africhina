'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Ban,
  Loader2,
} from 'lucide-react';
import { formatMoney } from '@/src/shared/lib/money.js';
import InvoiceModal from '@/components/orders/InvoiceModal.jsx';

const STATUS_CONFIG = {
  draft: {
    label: 'Draft Review',
    className:
      'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    stepIndex: 1,
  },
  pending_payment: {
    label: 'Payment Required',
    className:
      'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    stepIndex: 1,
  },
  paid: {
    label: 'Confirmed',
    className:
      'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    stepIndex: 2,
  },
  in_production: {
    label: 'Preparing',
    className:
      'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    stepIndex: 2,
  },
  in_production: {
    label: 'Processing',
    className:
      'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    stepIndex: 2,
  },
  in_progress: {
    label: 'Preparing',
    className:
      'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    stepIndex: 2,
  },
  ready_to_ship: {
    label: 'Ready to Ship',
    className:
      'text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    stepIndex: 3,
  },
  shipped: {
    label: 'Shipped',
    className:
      'text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    stepIndex: 3,
  },
  in_customs: {
    label: 'In Customs',
    className:
      'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    stepIndex: 3,
  },
  delivered: {
    label: 'Delivered',
    className:
      'text-green-700 bg-green-50 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
    stepIndex: 4,
  },
  completed: {
    label: 'Completed',
    className:
      'text-green-700 bg-green-50 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
    stepIndex: 4,
  },
  cancelled: {
    label: 'Cancelled',
    className:
      'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    stepIndex: -1,
  },
  refunded: {
    label: 'Refunded',
    className:
      'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    stepIndex: -1,
  },
};

const COSTS = [
  ['Product cost', 'productCost'],
  ['China domestic shipping', 'chinaShippingCost'],
  ['Inspection', 'inspectionCost'],
  ['International freight', 'internationalFreightCost'],
  ['Customs / clearance', 'customsCost'],
  ['Service fee', 'serviceFee'],
  ['Other charges', 'otherCharges'],
];

const TIMELINE_STEPS = [
  { key: 'placed', label: 'Order Placed', desc: 'Order created' },
  { key: 'payment', label: 'Payment', desc: 'Paystack checkout' },
  { key: 'preparing', label: 'Preparing', desc: 'Fulfillment & packaging' },
  { key: 'shipped', label: 'Shipped', desc: 'In transit to destination' },
  { key: 'delivered', label: 'Delivered', desc: 'Package received' },
];

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function OrderTimeline({ status }) {
  const meta = STATUS_CONFIG[status] ?? { stepIndex: 0 };
  const currentStep = meta.stepIndex;
  const isCancelled = status === 'cancelled' || status === 'refunded';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <AlertCircle size={18} className="text-gray-500" />
        <span>This order has been {status}.</span>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-bold text-foreground">Order Progress</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {TIMELINE_STEPS.map((step, idx) => {
          const isDone = currentStep > idx;
          const isCurrent = currentStep === idx;
          return (
            <div
              key={step.key}
              className={`flex flex-col rounded-lg border p-3 transition-colors ${
                isCurrent
                  ? 'border-primary bg-primary/5 text-primary'
                  : isDone
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                    : 'border-border/60 bg-muted/20 text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {isDone ? (
                  <CheckCircle2
                    size={14}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                ) : isCurrent ? (
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {idx + 1}
                  </span>
                ) : (
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-muted-foreground/30 text-[9px] font-bold text-foreground">
                    {idx + 1}
                  </span>
                )}
                <span>{step.label}</span>
              </div>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function OrderDetail({
  order: initialOrder,
  admin = false,
  isCheckout = false,
}) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [showInvoice, setShowInvoice] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const checkoutPath = `/checkout/${order.id}`;
  const statusMeta = STATUS_CONFIG[order.status] ?? {
    label: order.status.replace('_', ' '),
    className: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  const isPendingPayment =
    order.status === 'pending_payment' || order.status === 'draft';
  const isDirectSale = order.purchaseMode === 'DIRECT_SALE';
  const hasExtraCosts = COSTS.slice(1).some(
    ([, key]) => typeof order[key] === 'number' && order[key] > 0,
  );
  const isCancelled =
    order.status === 'cancelled' || order.status === 'refunded';
  const hasInvoice =
    Boolean(order.invoice) || (!isPendingPayment && !isCancelled);

  async function handleCancelOrder() {
    try {
      setCancelling(true);
      setCancelError(null);
      const res = await fetch(`/api/v1/orders/${order.id}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error?.message || data?.message || 'Failed to cancel order.',
        );
      }
      setOrder(data.data);
      setConfirmCancel(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  const mainContent = (
    <div className="flex flex-col gap-6">
      {/* Visual Timeline (only for non-checkout order detail views) */}
      {!isCheckout ? <OrderTimeline status={order.status} /> : null}

      {/* Items Section */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-sm font-bold text-foreground">
            Order Items ({order.items?.length ?? 0})
          </h2>
        </div>

        <div className="mt-4 divide-y divide-border">
          {order.items?.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 py-3.5 text-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productTitle}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-lg object-cover"
                      unoptimized
                    />
                  ) : (
                    <Package size={18} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {item.productTitle || item.product?.title || 'Order Item'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity.toLocaleString()}
                    {item.unitPrice ? (
                      <span>
                        {' '}
                        · {formatMoney(item.unitPrice, order.currency)} each
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="text-right font-bold text-foreground tabular-nums">
                {formatMoney(item.subtotal, order.currency)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Financial Breakdown Section */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="border-b border-border pb-3 text-sm font-bold text-foreground">
          Financial Summary
        </h2>
        <dl className="mt-3 divide-y divide-border text-sm">
          {isDirectSale ? (
            // Direct Sale: show Product × Qty lines, then total. No sourcing cost rows.
            order.items?.map((item) => (
              <div key={item.id} className="flex justify-between py-2">
                <dt className="text-muted-foreground">
                  {item.productTitle || 'Product'} &times; {item.quantity}
                </dt>
                <dd className="font-medium text-foreground tabular-nums">
                  {formatMoney(item.subtotal, order.currency)}
                </dd>
              </div>
            ))
          ) : (
            // Sourcing Import: show all non-zero cost rows.
            <>
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Product Subtotal</dt>
                <dd className="font-medium text-foreground tabular-nums">
                  {formatMoney(order.productCost, order.currency)}
                </dd>
              </div>
              {hasExtraCosts
                ? COSTS.slice(1).map(([label, key]) => {
                    const amount = order[key];
                    if (typeof amount !== 'number' || amount <= 0) return null;
                    return (
                      <div key={key} className="flex justify-between py-2">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium text-foreground tabular-nums">
                          {formatMoney(amount, order.currency)}
                        </dd>
                      </div>
                    );
                  })
                : null}
            </>
          )}

          <div className="flex justify-between pt-3 text-base font-bold text-foreground">
            <dt>Total</dt>
            <dd className="tabular-nums">
              {formatMoney(order.totalAmount, order.currency)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Delivery & Tracking Section */}
      {!isCheckout ? (
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Truck size={17} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Delivery & Tracking
            </h2>
          </div>

          <div className="mt-4 flex flex-col gap-4 text-sm">
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Destination Address
                </p>
                <p className="mt-0.5 font-medium text-foreground">
                  {order.shippingAddress || 'Standard Delivery Destination'}
                </p>
              </div>
            </div>

            {order.shipment ? (
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Carrier:
                    </span>
                    <p className="font-semibold text-foreground">
                      {order.shipment.carrier || 'Logistics Carrier Assigned'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Tracking Number:
                    </span>
                    <p className="font-mono font-semibold text-foreground">
                      {order.shipment.trackingNumber || 'Pending Assignment'}
                    </p>
                  </div>
                </div>

                {order.shipment.events?.length ? (
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Tracking Updates
                    </p>
                    <ol className="relative mt-2 border-l border-border pl-4">
                      {[...order.shipment.events]
                        .sort(
                          (a, b) =>
                            new Date(a.occurredAt) - new Date(b.occurredAt),
                        )
                        .map((evt) => (
                          <li key={evt.id} className="mb-3 last:mb-0">
                            <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary/80" />
                            <p className="text-xs font-semibold text-foreground">
                              {evt.description || evt.status}
                            </p>
                            {evt.location ? (
                              <p className="text-xs text-muted-foreground">
                                📍 {evt.location}
                              </p>
                            ) : null}
                            <p className="text-[10px] text-muted-foreground">
                              {formatDate(evt.occurredAt)}
                            </p>
                          </li>
                        ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  Tracking information will be available here once your order is
                  shipped.
                </p>
                <p className="mt-1">
                  Our logistics team processes dispatch after payment
                  confirmation and product preparation.
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Sourcing context card (internal/rfq origin only) */}
      {!isDirectSale && !isCheckout && order.quotation ? (
        <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-xs dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
              <FileText size={15} />
              <span className="font-semibold">
                Sourcing Offer:{' '}
                {order.quotation.referenceNumber || order.quotationId}
              </span>
            </div>
            {order.quotation.rfqId ? (
              <Link
                href={`/rfq/${order.quotation.rfqId}`}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                <span>View Sourcing Request</span>
                <ExternalLink size={12} />
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href={admin ? '/admin/orders' : '/orders'}
        className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to Orders
      </Link>

      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-sm font-bold text-foreground">
              {order.orderNumber}
            </span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {isDirectSale ? 'Direct Purchase' : 'Direct Order'}
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold text-foreground">
            Order Details
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusMeta.className}`}
          >
            {statusMeta.label}
          </span>
          <span className="text-xs text-muted-foreground">
            Total: {formatMoney(order.totalAmount, order.currency)}
          </span>
        </div>
      </header>

      {isCheckout ? (
        mainContent
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {mainContent}

          <aside className="flex h-fit flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Customer
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {order.buyer?.name || order.buyer?.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {order.buyer?.email}
              </p>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Payment Status
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    isPendingPayment ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                <p className="text-sm font-semibold text-foreground capitalize">
                  {isPendingPayment
                    ? 'Payment Required'
                    : order.paymentStatus || statusMeta.label}
                </p>
              </div>
            </div>

            {/* Contextual Action */}
            {!admin && isPendingPayment && !isCancelled ? (
              <div className="mt-2 flex flex-col gap-2.5 border-t border-border pt-4">
                <Link
                  href={checkoutPath}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <CreditCard size={16} />
                  <span>Pay with Paystack</span>
                </Link>
                <p className="text-center text-[11px] text-muted-foreground">
                  🔒 Complete your payment securely via Paystack.
                </p>

                {isDirectSale ? (
                  <div className="mt-2 border-t border-border/60 pt-3">
                    {confirmCancel ? (
                      <div className="rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs dark:border-red-900/40 dark:bg-red-950/20">
                        <p className="font-semibold text-red-800 dark:text-red-300">
                          Cancel this order?
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          Reserved stock will be released back to the store.
                        </p>
                        {cancelError ? (
                          <p className="mt-1.5 font-medium text-red-600">
                            {cancelError}
                          </p>
                        ) : null}
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCancelOrder}
                            disabled={cancelling}
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            {cancelling ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Ban size={12} />
                            )}
                            <span>
                              {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmCancel(false);
                              setCancelError(null);
                            }}
                            disabled={cancelling}
                            className="inline-flex flex-1 items-center justify-center rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                          >
                            Keep Order
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(true)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                      >
                        <Ban size={14} />
                        <span>Cancel Order</span>
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}

            {!admin && !isPendingPayment && order.status !== 'cancelled' ? (
              <div className="mt-2 space-y-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Payment Confirmed</span>
                  </div>
                  <p className="mt-1">
                    Your order is confirmed and progressing through fulfillment.
                  </p>
                </div>

                {hasInvoice ? (
                  <button
                    type="button"
                    onClick={() => setShowInvoice(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
                  >
                    <FileText size={15} className="text-primary" />
                    <span>View Invoice</span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      )}

      {showInvoice ? (
        <InvoiceModal
          orderId={order.id}
          onClose={() => setShowInvoice(false)}
        />
      ) : null}
    </div>
  );
}

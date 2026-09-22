'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { formatMoney } from '@/src/shared/lib/money.js';
import InvoiceModal from '@/components/orders/InvoiceModal.jsx';

// ---------------------------------------------------------------------------
// Status display maps
// ---------------------------------------------------------------------------
const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    className: 'text-gray-600 bg-gray-50 border-gray-200',
  },
  pending_payment: {
    label: 'Pending Payment',
    className:
      'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  paid: {
    label: 'Paid',
    className:
      'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  in_production: {
    label: 'Processing',
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
  completed: {
    label: 'Completed',
    className:
      'text-teal-700 bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
  },
  cancelled: {
    label: 'Cancelled',
    className:
      'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  },
};

// Maps current DB status → next allowed status and button label.
const FULFILLMENT_ACTIONS = {
  paid: { nextStatus: 'in_production', label: '▶ Start Processing' },
  in_production: { nextStatus: 'shipped', label: '📦 Mark as Shipped' },
  shipped: { nextStatus: 'delivered', label: '✔ Mark as Delivered' },
  delivered: { nextStatus: 'completed', label: '✅ Complete Order' },
};

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function formatShortDate(value) {
  try {
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

// ---------------------------------------------------------------------------
// Fulfillment Actions Panel
// ---------------------------------------------------------------------------
function FulfillmentActions({ order, onStatusChange }) {
  const action = FULFILLMENT_ACTIONS[order.status];
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');

  if (!action) return null;

  function handleAdvance() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/admin/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: action.nextStatus,
            note: note || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.message || 'Failed to update status.');
          return;
        }
        onStatusChange?.(action.nextStatus);
        window.location.reload();
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-foreground">
        Fulfillment Action
      </h3>
      <div className="flex flex-col gap-3">
        <div>
          <label
            htmlFor={`admin-order-note-${order.id}`}
            className="text-xs font-semibold text-muted-foreground"
          >
            Optional note to customer
          </label>
          <input
            id={`admin-order-note-${order.id}`}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Dispatched via DHL from Lagos warehouse"
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        {error ? (
          <p className="text-xs font-semibold text-red-600">{error}</p>
        ) : null}
        <button
          id={`admin-advance-status-${order.status}`}
          onClick={handleAdvance}
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? 'Updating…' : action.label}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shipment Form
// ---------------------------------------------------------------------------
function ShipmentForm({ order }) {
  const shipment = order.shipment;
  const [carrier, setCarrier] = useState(shipment?.carrier ?? '');
  const [trackingNumber, setTrackingNumber] = useState(
    shipment?.trackingNumber ?? '',
  );
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const isEligible = [
    'paid',
    'in_production',
    'ready_to_ship',
    'shipped',
    'delivered',
    'in_customs',
  ].includes(order.status);

  if (!isEligible) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4 text-xs text-muted-foreground">
        Shipment management is available once the order is paid.
      </div>
    );
  }

  function handleSave() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/admin/orders/${order.id}/shipment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            carrier: carrier || undefined,
            trackingNumber: trackingNumber || undefined,
            eventDescription: eventDescription || undefined,
            eventLocation: eventLocation || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.message || 'Failed to save shipment.');
          return;
        }
        setSuccess('Shipment saved successfully.');
        setEventDescription('');
        setEventLocation('');
        setTimeout(() => window.location.reload(), 800);
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`admin-carrier-${order.id}`}
            className="text-xs font-semibold text-muted-foreground"
          >
            Carrier
          </label>
          <input
            id={`admin-carrier-${order.id}`}
            type="text"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="e.g., DHL, FedEx, GIGL"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor={`admin-tracking-${order.id}`}
            className="text-xs font-semibold text-muted-foreground"
          >
            Tracking Number
          </label>
          <input
            id={`admin-tracking-${order.id}`}
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g., 1Z999AA10123456784"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          Add Tracking Event (optional)
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            id={`admin-event-desc-${order.id}`}
            type="text"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="Event description"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <input
            id={`admin-event-loc-${order.id}`}
            type="text"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            placeholder="Location (e.g., Lagos)"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {error ? (
        <p className="text-xs font-semibold text-red-600">{error}</p>
      ) : null}
      {success ? (
        <p className="text-xs font-semibold text-emerald-600">{success}</p>
      ) : null}

      <button
        id={`admin-save-shipment-${order.id}`}
        onClick={handleSave}
        disabled={isPending}
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending ? 'Saving…' : 'Save Shipment'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Tracking Event Form (standalone — after shipment exists)
// ---------------------------------------------------------------------------
function AddEventForm({ orderId, shipmentExists }) {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  if (!shipmentExists) return null;

  function handleAdd() {
    if (!description.trim() && !location.trim()) {
      setError('Provide a description or location.');
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/v1/admin/orders/${orderId}/shipment/events`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: description || undefined,
              location: location || undefined,
            }),
          },
        );
        const json = await res.json();
        if (!res.ok) {
          setError(json.message || 'Failed to add event.');
          return;
        }
        setSuccess('Event added.');
        setDescription('');
        setLocation('');
        setTimeout(() => window.location.reload(), 600);
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <p className="text-xs font-semibold text-muted-foreground">
        Add Tracking Update
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          id={`admin-quick-event-desc-${orderId}`}
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Update description"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <input
          id={`admin-quick-event-loc-${orderId}`}
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="w-36 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          id={`admin-add-event-${orderId}`}
          onClick={handleAdd}
          disabled={isPending}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          <Plus size={14} />
          {isPending ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : success ? (
        <p className="text-xs text-emerald-600">{success}</p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function AdminOrderDetail({ order }) {
  const [showInvoice, setShowInvoice] = useState(false);
  const statusMeta = STATUS_CONFIG[order.status] ?? {
    label: order.status?.replace(/_/g, ' ') ?? '—',
    className: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  const isDirectSale = order.purchaseMode === 'DIRECT_SALE';

  // For direct-sale orders: financial summary = total only (productCost = total).
  // Do NOT show China shipping / inspection / customs / service fee breakdown.
  const paymentVerified = order.payments?.some?.(
    (p) => p.status === 'VERIFIED',
  );

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Back Link */}
      <Link
        href="/admin/orders"
        className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to Orders
      </Link>

      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-sm font-bold text-foreground">
              {order.orderNumber}
            </span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {isDirectSale ? 'Direct Sale' : 'Sourcing Import'}
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

      {/* Body Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Items Section */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="border-b border-border pb-3 text-sm font-bold text-foreground">
              Order Items ({order.items?.length ?? 0})
            </h2>
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
                          alt={item.productTitle ?? ''}
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
                        {item.productTitle ||
                          item.product?.title ||
                          'Order Item'}
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

          {/* Financial Summary — Direct Sale only shows total */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="border-b border-border pb-3 text-sm font-bold text-foreground">
              Financial Summary
            </h2>
            <dl className="mt-3 text-sm">
              {isDirectSale ? (
                <>
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between py-2">
                      <dt className="text-muted-foreground">
                        {item.productTitle || 'Product'} × {item.quantity}
                      </dt>
                      <dd className="font-medium text-foreground tabular-nums">
                        {formatMoney(item.subtotal, order.currency)}
                      </dd>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Product Cost</dt>
                  <dd className="font-medium text-foreground tabular-nums">
                    {formatMoney(order.productCost, order.currency)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base font-bold text-foreground">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  {formatMoney(order.totalAmount, order.currency)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Shipment & Tracking */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Truck size={17} className="text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                Shipment & Tracking
              </h2>
            </div>

            {order.shipment ? (
              <div className="mt-4 flex flex-col gap-4 text-sm">
                {/* Carrier & Tracking Number */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Carrier:
                    </span>
                    <p className="font-semibold text-foreground">
                      {order.shipment.carrier || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Tracking Number:
                    </span>
                    <p className="font-mono font-semibold text-foreground">
                      {order.shipment.trackingNumber || '—'}
                    </p>
                  </div>
                </div>

                {/* Tracking Timeline */}
                {order.shipment.events?.length ? (
                  <div className="border-t border-border pt-4">
                    <p className="mb-3 text-xs font-semibold text-muted-foreground">
                      Tracking Timeline
                    </p>
                    <ol className="relative border-l border-border pl-5">
                      {[...order.shipment.events]
                        .sort(
                          (a, b) =>
                            new Date(a.occurredAt) - new Date(b.occurredAt),
                        )
                        .map((evt, idx) => (
                          <li key={evt.id} className="mb-4 last:mb-0">
                            <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full border border-border bg-primary/80" />
                            <p className="text-xs font-semibold text-foreground">
                              {evt.description || evt.status}
                            </p>
                            {evt.location ? (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin size={10} />
                                {evt.location}
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
              <p className="mt-3 text-xs text-muted-foreground">
                No shipment created yet. Use the form below to add carrier and
                tracking information.
              </p>
            )}

            {/* Shipment Management Form */}
            <div className="mt-5 border-t border-border pt-5">
              <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Manage Shipment
              </p>
              <ShipmentForm order={order} />
            </div>

            {/* Quick Add Tracking Event */}
            <AddEventForm
              orderId={order.id}
              shipmentExists={Boolean(order.shipment)}
            />
          </section>

          {/* Destination */}
          {order.shippingAddress ? (
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-2">
                <MapPin
                  size={16}
                  className="mt-0.5 shrink-0 text-muted-foreground"
                />
                <div>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Delivery Destination
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {order.shippingAddress}
                  </p>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        {/* Right Sidebar */}
        <aside className="flex h-fit flex-col gap-4">
          {/* Customer Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Customer
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {order.buyer?.name || '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.buyer?.email}
            </p>
            {order.buyer?.phone ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {order.buyer.phone}
              </p>
            ) : null}
          </div>

          {/* Payment Status */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Payment
            </p>
            {paymentVerified ? (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={16} />
                Verified via Paystack
              </div>
            ) : order.status === 'pending_payment' ? (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600">
                <Clock size={16} />
                Awaiting Payment
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={16} />
                Payment Confirmed
              </div>
            )}

            {order.payments?.length ? (
              <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                {order.payments.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground">
                      {formatShortDate(p.createdAt)}
                    </span>
                    <span
                      className={`font-semibold ${
                        p.status === 'VERIFIED'
                          ? 'text-emerald-600'
                          : p.status === 'FAILED'
                            ? 'text-red-500'
                            : 'text-amber-600'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Invoice */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-muted-foreground" />
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Invoice
              </p>
            </div>
            {order.invoice ? (
              <div className="mt-2 space-y-3">
                <p className="font-mono text-sm font-semibold text-foreground">
                  {order.invoice.invoiceNumber}
                </p>
                <button
                  type="button"
                  onClick={() => setShowInvoice(true)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
                >
                  <FileText size={14} className="text-primary" />
                  <span>View Official Invoice</span>
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Invoice generated automatically on payment verification.
              </p>
            )}
          </div>

          {/* Fulfillment Actions */}
          <FulfillmentActions order={order} />
        </aside>
      </div>

      {showInvoice ? (
        <InvoiceModal
          orderId={order.id}
          endpoint={`/api/v1/admin/orders/${order.id}/invoice`}
          onClose={() => setShowInvoice(false)}
        />
      ) : null}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Package,
  CalendarDays,
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
} from 'lucide-react';
import { formatMoney } from '@/src/shared/lib/money.js';

const STATUS_META = {
  open: {
    label: 'Under Review',
    Icon: Clock,
    className: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  quoted: {
    label: 'Offer Available',
    Icon: FileText,
    className: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  accepted: {
    label: 'Offer Accepted',
    Icon: CheckCircle2,
    className: 'text-green-700 bg-green-50 border-green-200',
  },
  closed: {
    label: 'Closed',
    Icon: XCircle,
    className: 'text-gray-600 bg-gray-50 border-gray-200',
  },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.open;
  const { label, Icon, className } = meta;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      <Icon size={13} />
      {label}
    </span>
  );
}

function formatDate(dateStr) {
  try {
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function SourcingStepper({ status }) {
  const steps = [
    { key: 'submitted', label: 'Request Submitted' },
    { key: 'review', label: 'Under Review' },
    { key: 'offer', label: 'Offer Available' },
    { key: 'order', label: 'Order & Delivery' },
  ];

  let currentStepIdx = 0;
  if (status === 'open') currentStepIdx = 1;
  else if (status === 'quoted') currentStepIdx = 2;
  else if (status === 'accepted') currentStepIdx = 3;
  else if (status === 'closed') currentStepIdx = 1;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Sourcing Journey
      </p>
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, idx) => {
          const isDone = status !== 'closed' && idx < currentStepIdx;
          const isCurrent = idx === currentStepIdx;
          return (
            <div
              key={step.key}
              className="flex flex-col items-center text-center"
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  isDone
                    ? 'bg-green-600 text-white'
                    : isCurrent
                      ? status === 'closed'
                        ? 'bg-gray-400 text-white'
                        : 'bg-primary text-primary-foreground ring-4 ring-primary/15'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <p
                className={`mt-1.5 text-[11px] leading-tight font-medium ${
                  isCurrent
                    ? 'font-bold text-foreground'
                    : isDone
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuotationCard({ quotation, rfqId, onUpdate }) {
  const router = useRouter();
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const isExpired =
    quotation.expiresAt && new Date(quotation.expiresAt) < new Date();
  const isSent = quotation.status === 'sent';
  const canAct = isSent && !isExpired;

  async function handleAction(action) {
    setActing(true);
    setActionError('');
    try {
      const res = await fetch(`/api/v1/quotations/${quotation.id}/${action}`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(
          json.message ?? 'Something went wrong. Please try again.',
        );
        setActing(false);
        return;
      }
      if (action === 'accept' && json.data?.order?.id) {
        router.push(`/orders/${json.data.order.id}`);
        return;
      }
      if (action === 'accept') {
        setActionError(
          'The order was not returned. Please refresh and try again.',
        );
        return;
      }
      onUpdate();
    } catch {
      setActionError('A network error occurred. Please try again.');
    } finally {
      setActing(false);
    }
  }

  return (
    <div
      suppressHydrationWarning
      className="overflow-hidden rounded-xl border border-blue-200 bg-blue-50/40"
    >
      {/* Header */}
      <div
        suppressHydrationWarning
        className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-blue-50 px-5 py-3"
      >
        <div suppressHydrationWarning className="flex items-center gap-2">
          <FileText size={15} className="text-blue-600" />
          <span className="text-sm font-bold text-blue-900">
            Sourcing Offer
          </span>
          {quotation.referenceNumber && (
            <span className="font-mono text-xs text-blue-600">
              ({quotation.referenceNumber})
            </span>
          )}
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            quotation.status === 'accepted'
              ? 'bg-green-100 text-green-700'
              : quotation.status === 'rejected'
                ? 'bg-red-100 text-red-700'
                : isExpired
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-blue-100 text-blue-700'
          }`}
        >
          {quotation.status === 'accepted'
            ? 'Accepted'
            : quotation.status === 'rejected'
              ? 'Declined'
              : quotation.status === 'sent' && isExpired
                ? 'Expired'
                : 'Active Offer'}
        </span>
      </div>

      <div suppressHydrationWarning className="flex flex-col gap-4 p-5">
        {/* Price & Delivery */}
        <div
          suppressHydrationWarning
          className="flex flex-wrap items-start justify-between gap-4"
        >
          <div suppressHydrationWarning>
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Total Sourcing Price
            </p>
            <p className="mt-1 text-3xl font-bold text-foreground tabular-nums">
              {formatMoney(quotation.price, quotation.currency)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Total price including procurement & shipping to destination
            </p>
          </div>
          <div suppressHydrationWarning className="text-right">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Est. Delivery
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {quotation.deliveryEstimate || 'Standard shipping'}
            </p>
            {quotation.expiresAt && (
              <p
                className={`mt-0.5 text-xs ${isExpired ? 'font-semibold text-red-600' : 'text-muted-foreground'}`}
              >
                {isExpired ? 'Expired' : 'Valid until'}:{' '}
                {formatDate(quotation.expiresAt)}
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        {quotation.notes && (
          <div
            suppressHydrationWarning
            className="rounded-lg border border-border bg-card/80 px-4 py-3"
          >
            <p className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Pricing Notes & Specifications
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {quotation.notes}
            </p>
          </div>
        )}

        {/* Expired warning */}
        {isSent && isExpired && (
          <div
            suppressHydrationWarning
            className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            This offer has expired. Please contact support to request a
            refreshed offer.
          </div>
        )}

        {/* Action error */}
        {actionError && (
          <div
            suppressHydrationWarning
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {actionError}
          </div>
        )}

        {/* Accepted state + Connected Order Link */}
        {quotation.status === 'accepted' && (
          <div
            suppressHydrationWarning
            className="flex flex-col gap-3 rounded-lg border border-green-200 bg-green-50 p-4"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-green-900">
              <BadgeCheck size={18} className="text-green-600" />
              <span>Offer Accepted — Order Created</span>
            </div>
            <p className="text-xs text-green-800">
              You accepted this offer. The corresponding order has been
              generated and is ready for payment and fulfillment.
            </p>
            {quotation.order && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-green-200 bg-white px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Order Reference
                  </p>
                  <p className="font-mono text-sm font-bold text-foreground">
                    {quotation.order.orderNumber}
                  </p>
                </div>
                <Link
                  href={`/orders/${quotation.order.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-green-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-800"
                >
                  View Order Details →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Rejected */}
        {quotation.status === 'rejected' && (
          <div
            suppressHydrationWarning
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600"
          >
            <XCircle size={15} />
            You declined this offer. You can contact our sourcing team if you
            would like a revised quote.
          </div>
        )}

        {/* Accept / Reject */}
        {canAct && (
          <div suppressHydrationWarning className="flex flex-col gap-3">
            {!showRejectConfirm ? (
              <div suppressHydrationWarning className="flex flex-wrap gap-3">
                <button
                  id="accept-quotation-btn"
                  onClick={() => handleAction('accept')}
                  disabled={acting}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  <CheckCircle2 size={15} />
                  {acting ? 'Processing…' : 'Accept Offer & Create Order'}
                </button>
                <button
                  id="reject-quotation-btn"
                  onClick={() => setShowRejectConfirm(true)}
                  disabled={acting}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
                >
                  <XCircle size={15} />
                  Decline Offer
                </button>
              </div>
            ) : (
              <div
                suppressHydrationWarning
                className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4"
              >
                <p className="text-sm font-semibold text-foreground">
                  Are you sure you want to decline this offer?
                </p>
                <p className="text-xs text-muted-foreground">
                  The sourcing request will remain open so our team can provide
                  a revised offer if needed.
                </p>
                <div suppressHydrationWarning className="flex gap-2">
                  <button
                    id="confirm-reject-btn"
                    onClick={() => handleAction('reject')}
                    disabled={acting}
                    className="rounded-md bg-destructive px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {acting ? 'Processing…' : 'Yes, decline offer'}
                  </button>
                  <button
                    onClick={() => setShowRejectConfirm(false)}
                    disabled={acting}
                    className="rounded-md border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
                  >
                    Keep reviewing
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RfqDetail({ rfq: initialRfq }) {
  const [rfq, setRfq] = useState(initialRfq);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const canCancel = rfq.status === 'open';
  const item = rfq.items?.[0] ?? null;
  const product = item?.product ?? null;
  const quotations = rfq.quotations ?? [];

  // Most-recent sent or accepted quotation shown prominently
  const activeQuotation =
    quotations.find((q) => q.status === 'sent') ??
    quotations.find((q) => q.status === 'accepted') ??
    null;
  const olderQuotations = quotations.filter((q) => q !== activeQuotation);

  async function handleCancel() {
    setCancelling(true);
    setCancelError('');
    try {
      const res = await fetch(`/api/v1/rfqs/${rfq.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        setCancelError(
          json.message || 'Could not cancel this request. Please try again.',
        );
        setCancelling(false);
        return;
      }
      setRfq(json.data);
      setShowConfirm(false);
    } catch {
      setCancelError('A network error occurred. Please try again.');
    } finally {
      setCancelling(false);
    }
  }

  async function refreshRfq() {
    try {
      const res = await fetch(`/api/v1/rfqs/${rfq.id}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setRfq(json.data);
      }
    } catch {
      // silently fail — user can refresh manually
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {/* Back */}
      <Link
        href="/rfq"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={15} />
        Back to Sourcing Requests
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            {product?.title ?? rfq.title ?? 'Sourcing Request'}
          </h1>
          <StatusBadge status={rfq.status} />
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {rfq.referenceNumber}
        </p>
      </div>

      {/* Sourcing Stepper */}
      <SourcingStepper status={rfq.status} />

      {/* Cancel error */}
      {cancelError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {cancelError}
        </div>
      )}

      {/* Active Quotation / Offer */}
      {activeQuotation && (
        <QuotationCard
          key={activeQuotation.id}
          quotation={activeQuotation}
          rfqId={rfq.id}
          onUpdate={refreshRfq}
        />
      )}

      {/* Product card */}
      {product ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex gap-4 p-5">
            {product.image && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border">
                <Image
                  src={product.image.url}
                  alt={product.image.alt || product.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {product.category?.name ?? 'Catalogue Product'}
              </p>
              <p className="mt-0.5 font-semibold text-foreground">
                {product.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                Indicative price: {formatMoney(product.price, product.currency)}
              </p>
              <Link
                href={`/catalogue/${product.id}`}
                className="mt-1 inline-block text-xs text-primary hover:underline"
              >
                View in catalogue →
              </Link>
            </div>
          </div>
        </div>
      ) : rfq.title ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Product Description
          </p>
          <p className="mt-1 font-semibold text-foreground">{rfq.title}</p>
        </div>
      ) : null}

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <Package
            size={18}
            className="mt-0.5 shrink-0 text-muted-foreground"
          />
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Quantity Requested
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
              {item?.quantity?.toLocaleString() ?? '—'} units
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <MapPin size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Destination
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {rfq.destination}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 sm:col-span-2">
          <CalendarDays
            size={18}
            className="mt-0.5 shrink-0 text-muted-foreground"
          />
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Date Submitted
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {formatDate(rfq.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Requirements / Notes */}
      {(item?.notes || rfq.description) && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Your Requirements & Specifications
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {item?.notes ?? rfq.description}
          </p>
        </div>
      )}

      {/* Older quotations */}
      {olderQuotations.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none text-sm text-muted-foreground transition hover:text-foreground">
            <span className="underline underline-offset-2">
              View {olderQuotations.length} earlier offer
              {olderQuotations.length !== 1 ? 's' : ''}
            </span>
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {olderQuotations.map((q) => (
              <QuotationCard
                key={q.id}
                quotation={q}
                rfqId={rfq.id}
                onUpdate={refreshRfq}
              />
            ))}
          </div>
        </details>
      )}

      {/* What happens next */}
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <h2 className="text-sm font-semibold text-foreground">
          What happens next?
        </h2>
        {rfq.status === 'open' && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Our team in China is reviewing your specifications and reaching out
            to vetted suppliers to secure the best pricing. You will receive an
            offer here once quotes are ready.
          </p>
        )}
        {rfq.status === 'quoted' && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A sourcing offer has been prepared for you above. Review the total
            price and estimated delivery timeline, then click{' '}
            <strong>Accept Offer</strong> to generate your order.
          </p>
        )}
        {rfq.status === 'accepted' && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You have accepted this sourcing offer. Your order is created and
            ready for payment and fulfillment. Click{' '}
            <strong>View Order Details</strong> above to track your order.
          </p>
        )}
        {rfq.status === 'closed' && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This sourcing request has been closed. If you still need this
            product sourced, you can submit a new request at any time.
          </p>
        )}
      </div>

      {/* Cancel action */}
      {canCancel && (
        <div className="border-t border-border pt-4">
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-sm text-destructive transition hover:underline"
            >
              Cancel this sourcing request
            </button>
          ) : (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <p className="text-sm font-medium text-foreground">
                Are you sure you want to cancel this sourcing request?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={cancelling}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
                >
                  Keep it
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New request CTA */}
      {(rfq.status === 'closed' || rfq.status === 'accepted') && (
        <Link
          href="/rfq/new"
          className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Submit another sourcing request
        </Link>
      )}
    </div>
  );
}

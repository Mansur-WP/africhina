'use client';

import { useState } from 'react';
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
  User,
  Plus,
} from 'lucide-react';
import { formatMoney } from '@/src/shared/lib/money.js';

const STATUS_META = {
  open: {
    label: 'Open / Pending',
    Icon: Clock,
    className: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  quoted: {
    label: 'Quoted',
    Icon: FileText,
    className: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  accepted: {
    label: 'Accepted',
    Icon: CheckCircle2,
    className: 'text-green-700 bg-green-50 border-green-200',
  },
  closed: {
    label: 'Closed / Cancelled',
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

export default function AdminRfqDetail({ rfq }) {
  const item = rfq.items?.[0] ?? null;
  const product = item?.product ?? null;
  const buyer = rfq.buyer ?? {};

  const isEligibleForQuote = rfq.status === 'open' || rfq.status === 'quoted';

  return (
    <div suppressHydrationWarning className="flex max-w-4xl flex-col gap-6">
      {/* Back */}
      <Link
        href="/admin/rfqs"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={15} />
        Back to Sourcing Requests
      </Link>

      {/* Header */}
      <div
        suppressHydrationWarning
        className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div suppressHydrationWarning className="flex flex-col gap-2">
          <div
            suppressHydrationWarning
            className="flex flex-wrap items-center gap-3"
          >
            <h1 className="text-2xl font-bold text-foreground">
              {product?.title ?? rfq.title ?? 'Sourcing Request'}
            </h1>
            <StatusBadge status={rfq.status} />
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {rfq.referenceNumber}
          </p>
        </div>

        {isEligibleForQuote && (
          <Link
            href={`/admin/rfqs/${rfq.id}/quotation`}
            id="create-quote-btn"
            className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Plus size={16} />
            Create Quotation
          </Link>
        )}
      </div>

      <div
        suppressHydrationWarning
        className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3"
      >
        {/* Main detail column */}
        <div
          suppressHydrationWarning
          className="flex flex-col gap-6 lg:col-span-2"
        >
          {/* Product details */}
          {product ? (
            <div
              suppressHydrationWarning
              className="rounded-xl border border-border bg-card p-5"
            >
              <h2 className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Requested Catalogue Product
              </h2>
              <div suppressHydrationWarning className="flex items-start gap-4">
                {product.images?.[0] && (
                  <div
                    suppressHydrationWarning
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].alt || product.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                )}
                <div suppressHydrationWarning className="min-w-0">
                  <p className="font-semibold text-foreground">
                    {product.title}
                  </p>
                  {product.category && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Category: {product.category.name}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                    Indicative price:{' '}
                    {formatMoney(product.price, product.currency)}
                  </p>
                  <Link
                    href={`/catalogue/${product.id}`}
                    target="_blank"
                    className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                  >
                    View product in catalog ↗
                  </Link>
                </div>
              </div>
            </div>
          ) : rfq.title ? (
            <div
              suppressHydrationWarning
              className="rounded-xl border border-border bg-card p-5"
            >
              <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Custom Sourcing Description
              </h2>
              <p className="text-sm leading-relaxed font-semibold text-foreground">
                {rfq.title}
              </p>
            </div>
          ) : null}

          {/* Sourcing details grid */}
          <div
            suppressHydrationWarning
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div
              suppressHydrationWarning
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
            >
              <Package
                size={18}
                className="mt-0.5 shrink-0 text-muted-foreground"
              />
              <div suppressHydrationWarning>
                <p className="text-xs font-medium text-muted-foreground">
                  Quantity requested
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                  {item?.quantity?.toLocaleString() ?? '—'} units
                </p>
              </div>
            </div>
            <div
              suppressHydrationWarning
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
            >
              <MapPin
                size={18}
                className="mt-0.5 shrink-0 text-muted-foreground"
              />
              <div suppressHydrationWarning>
                <p className="text-xs font-medium text-muted-foreground">
                  Destination
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {rfq.destination}
                </p>
              </div>
            </div>
          </div>

          {/* Customer specifications */}
          {(item?.notes || rfq.description) && (
            <div
              suppressHydrationWarning
              className="rounded-xl border border-border bg-card p-5"
            >
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Customer Requirements & Notes
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {item?.notes ?? rfq.description}
              </p>
            </div>
          )}

          {/* Quotations History */}
          <div
            suppressHydrationWarning
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div
              suppressHydrationWarning
              className="border-b border-border bg-muted/20 px-5 py-4"
            >
              <h3 className="text-sm font-bold text-foreground">
                Quotations History
              </h3>
            </div>
            {rfq.quotations?.length === 0 ? (
              <div
                suppressHydrationWarning
                className="p-8 text-center text-sm text-muted-foreground"
              >
                No quotations prepared for this request yet.
              </div>
            ) : (
              <div suppressHydrationWarning className="divide-y divide-border">
                {rfq.quotations.map((q) => (
                  <div
                    key={q.id}
                    suppressHydrationWarning
                    className="flex flex-col justify-between gap-4 p-5 transition hover:bg-muted/10 sm:flex-row sm:items-center"
                  >
                    <div suppressHydrationWarning>
                      <div
                        suppressHydrationWarning
                        className="flex items-center gap-2"
                      >
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {q.referenceNumber || 'QTN-Pending'}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            q.status === 'accepted'
                              ? 'bg-green-50 text-green-700'
                              : q.status === 'rejected'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <div
                        suppressHydrationWarning
                        className="mt-1 text-xs text-muted-foreground"
                      >
                        Sent on {formatDate(q.createdAt)}
                        {q.expiresAt &&
                          ` · Expired: ${formatDate(q.expiresAt)}`}
                      </div>
                      {q.notes && (
                        <p className="mt-2 line-clamp-2 max-w-md text-xs text-muted-foreground">
                          {q.notes}
                        </p>
                      )}
                    </div>
                    <div
                      suppressHydrationWarning
                      className="text-right whitespace-nowrap"
                    >
                      <span className="text-base font-bold text-foreground tabular-nums">
                        {formatMoney(q.price, q.currency)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Est. Delivery: {q.deliveryEstimate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar/Customer info column */}
        <div suppressHydrationWarning className="flex flex-col gap-6">
          <div
            suppressHydrationWarning
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="mb-4 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <User size={14} />
              Customer Profile
            </h2>
            <div suppressHydrationWarning className="flex flex-col gap-3">
              <div suppressHydrationWarning>
                <p className="text-xs font-medium text-muted-foreground">
                  Name
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {buyer.name || 'Importers Ltd'}
                </p>
              </div>
              <div suppressHydrationWarning>
                <p className="text-xs font-medium text-muted-foreground">
                  Email Address
                </p>
                <p className="mt-0.5 text-sm font-semibold break-all text-foreground">
                  {buyer.email}
                </p>
              </div>
              <div suppressHydrationWarning>
                <p className="text-xs font-medium text-muted-foreground">
                  Phone Number
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {buyer.phone || 'No phone provided'}
                </p>
              </div>
            </div>
          </div>

          <div
            suppressHydrationWarning
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <CalendarDays size={14} />
              Timestamps
            </h2>
            <div suppressHydrationWarning className="flex flex-col gap-3">
              <div suppressHydrationWarning>
                <p className="text-xs font-medium text-muted-foreground">
                  Submitted Date
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {formatDate(rfq.createdAt)}
                </p>
              </div>
              <div suppressHydrationWarning>
                <p className="text-xs font-medium text-muted-foreground">
                  Last Modified
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {formatDate(rfq.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

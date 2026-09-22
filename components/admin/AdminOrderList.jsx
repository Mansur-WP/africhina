'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/src/shared/lib/money.js';

// ---------------------------------------------------------------------------
// Status configuration — maps DB status values to display labels / colours.
// "Processing" = db: in_production (no schema change).
// ---------------------------------------------------------------------------
const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    dot: 'bg-gray-400',
    badge:
      'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  },
  pending_payment: {
    label: 'Pending Payment',
    dot: 'bg-amber-500',
    badge:
      'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  paid: {
    label: 'Paid',
    dot: 'bg-emerald-500',
    badge:
      'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  in_production: {
    label: 'Processing',
    dot: 'bg-blue-500',
    badge:
      'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  },
  shipped: {
    label: 'Shipped',
    dot: 'bg-indigo-500',
    badge:
      'text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  },
  delivered: {
    label: 'Delivered',
    dot: 'bg-green-500',
    badge:
      'text-green-700 bg-green-50 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  },
  completed: {
    label: 'Completed',
    dot: 'bg-teal-500',
    badge:
      'text-teal-700 bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
  },
  cancelled: {
    label: 'Cancelled',
    dot: 'bg-gray-400',
    badge:
      'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  },
};

const FILTER_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending Payment', value: 'pending_payment' },
  { label: 'Paid', value: 'paid' },
  { label: 'Processing', value: 'in_production' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function formatDate(value) {
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

function StatusBadge({ status }) {
  const meta = STATUS_CONFIG[status] ?? {
    label: status?.replace(/_/g, ' ') ?? '—',
    dot: 'bg-gray-400',
    badge: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export default function AdminOrderList({ initialOrders, initialStats }) {
  const [activeFilter, setActiveFilter] = useState('');
  const [orders, setOrders] = useState(initialOrders ?? []);
  const [isPending, startTransition] = useTransition();

  function handleFilter(value) {
    setActiveFilter(value);
    startTransition(async () => {
      try {
        const url =
          `/api/v1/admin/orders?limit=100&withStats=false` +
          (value ? `&status=${value}` : '');
        const res = await fetch(url);
        const json = await res.json();
        setOrders(json.data?.orders ?? []);
      } catch {
        // Retain existing list on network error.
      }
    });
  }

  const stats = initialStats ?? {};

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Pending Payment',
            value: stats.byStatus?.pending_payment ?? 0,
            colour: 'text-amber-600',
          },
          {
            label: 'Processing',
            value: stats.byStatus?.in_production ?? 0,
            colour: 'text-blue-600',
          },
          {
            label: 'Shipped',
            value: stats.byStatus?.shipped ?? 0,
            colour: 'text-indigo-600',
          },
          {
            label: 'Completed',
            value: stats.byStatus?.completed ?? 0,
            colour: 'text-teal-600',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              {card.label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${card.colour}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            id={`admin-order-filter-${tab.value || 'all'}`}
            onClick={() => handleFilter(tab.value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeFilter === tab.value
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {isPending ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/10 p-10 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No orders match this filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Table Header */}
          <div className="hidden grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase sm:grid">
            <span>Order</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Total</span>
            <span>Payment</span>
            <span>Status</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {orders.map((order) => {
              const paymentVerified = order.payments?.some?.(
                (p) => p.status === 'VERIFIED',
              );
              const paymentLabel =
                order.status === 'pending_payment'
                  ? 'Awaiting'
                  : paymentVerified
                    ? 'Verified'
                    : order.status === 'cancelled'
                      ? 'Cancelled'
                      : 'Confirmed';
              const paymentColour =
                paymentLabel === 'Verified' || paymentLabel === 'Confirmed'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : paymentLabel === 'Awaiting'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-500';

              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="grid grid-cols-1 gap-2 px-5 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] sm:items-center sm:gap-4"
                >
                  <div>
                    <p className="font-mono text-xs font-bold text-foreground">
                      {order.orderNumber}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {order.purchaseMode === 'DIRECT_SALE'
                        ? 'Direct Sale'
                        : 'Sourcing Import'}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {order.buyer?.name || '—'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.buyer?.email}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </p>
                  <p className="text-sm font-bold text-foreground tabular-nums">
                    {formatMoney(order.totalAmount, order.currency)}
                  </p>
                  <p className={`text-xs font-semibold ${paymentColour}`}>
                    {paymentLabel}
                  </p>
                  <StatusBadge status={order.status} />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

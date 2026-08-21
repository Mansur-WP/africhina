'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';

const STATUS_META = {
  open: {
    label: 'Open',
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
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}

function formatDate(dateStr) {
  try {
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function RfqCard({ rfq }) {
  const productTitle =
    rfq.item?.product?.title ?? rfq.title ?? 'Custom sourcing request';
  const category = rfq.item?.product?.category?.name;
  const qty = rfq.item?.quantity;

  return (
    <Link
      href={`/rfq/${rfq.id}`}
      className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition hover:border-primary/40 hover:shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {productTitle}
          </span>
          <StatusBadge status={rfq.status} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">{rfq.referenceNumber}</span>
          {category && <span>· {category}</span>}
          {qty && <span>· Qty {qty.toLocaleString()}</span>}
          <span>· {rfq.destination}</span>
          <span>· {formatDate(rfq.createdAt)}</span>
        </div>
      </div>
      <ChevronRight
        size={16}
        className="shrink-0 text-muted-foreground transition group-hover:text-foreground"
      />
    </Link>
  );
}

const STATUS_FILTERS = ['all', 'open', 'quoted', 'accepted', 'closed'];

export default function RfqList({ initialRfqs, initialPagination }) {
  const [rfqs, setRfqs] = useState(initialRfqs ?? []);
  const [pagination, setPagination] = useState(initialPagination ?? {});
  const [activeStatus, setActiveStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  async function load(status, p = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (status && status !== 'all') params.set('status', status);
      const res = await fetch(`/api/v1/rfqs?${params}`);
      const json = await res.json();
      if (json.success) {
        setRfqs(json.data ?? []);
        setPagination(json.meta ?? {});
      }
    } finally {
      setLoading(false);
    }
  }

  function handleStatusFilter(status) {
    setActiveStatus(status);
    setPage(1);
    load(status, 1);
  }

  function handlePageChange(p) {
    setPage(p);
    load(activeStatus, p);
  }

  const isEmpty = !loading && rfqs.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Requests</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            All your sourcing requests with Africhina Connect.
          </p>
        </div>
        <Link
          href="/rfq/new"
          id="rfq-new-btn"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus size={15} />
          New Request
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => handleStatusFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${
              activeStatus === s
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {s === 'all' ? 'All' : (STATUS_META[s]?.label ?? s)}
          </button>
        ))}
      </div>

      {/* RFQ list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-muted/30"
            />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
          <FileText
            size={36}
            className="text-muted-foreground/40"
            strokeWidth={1}
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              No requests yet
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {activeStatus === 'all'
                ? 'Submit your first sourcing request to get started.'
                : `No ${STATUS_META[activeStatus]?.label.toLowerCase() ?? activeStatus} requests found.`}
            </p>
          </div>
          <Link
            href="/rfq/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus size={13} />
            New Request
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rfqs.map((rfq) => (
            <RfqCard key={rfq.id} rfq={rfq} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ·{' '}
            {pagination.total} request{pagination.total !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={!pagination.hasPrevPage}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!pagination.hasNextPage}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

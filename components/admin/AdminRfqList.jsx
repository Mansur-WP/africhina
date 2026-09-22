'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react';

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

const STATUS_FILTERS = ['all', 'open', 'quoted', 'accepted', 'closed'];

export default function AdminRfqList({ initialRfqs, initialPagination }) {
  const [rfqs, setRfqs] = useState(initialRfqs ?? []);
  const [pagination, setPagination] = useState(initialPagination ?? {});
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  async function load(status, p = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (status && status !== 'all') params.set('status', status);
      const res = await fetch(`/api/v1/admin/rfqs?${params}`);
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

  // Filter list locally by reference or customer email
  const filteredRfqs = rfqs.filter((rfq) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    const ref = rfq.referenceNumber?.toLowerCase() ?? '';
    const email = rfq.buyer?.email?.toLowerCase() ?? '';
    const name = rfq.buyer?.name?.toLowerCase() ?? '';
    const title =
      rfq.item?.product?.title?.toLowerCase() ?? rfq.title?.toLowerCase() ?? '';
    return (
      ref.includes(term) ||
      email.includes(term) ||
      name.includes(term) ||
      title.includes(term)
    );
  });

  const isEmpty = !loading && filteredRfqs.length === 0;

  return (
    <div suppressHydrationWarning className="flex flex-col gap-6">
      {/* Title */}
      <div suppressHydrationWarning>
        <h1 className="text-2xl font-bold text-foreground">
          RFQ Sourcing Management
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          View customer sourcing requests and manage quotations.
        </p>
      </div>

      {/* Toolbar */}
      <div
        suppressHydrationWarning
        className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center"
      >
        {/* Search */}
        <div suppressHydrationWarning className="relative max-w-md flex-1">
          <Search
            size={16}
            className="absolute top-3.5 left-3 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search by reference, customer name, email, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border py-2.5 pr-4 pl-9 text-sm transition outline-none focus:border-ring"
          />
        </div>

        {/* Filters */}
        <div suppressHydrationWarning className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusFilter(s)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                activeStatus === s
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'All RFQs' : (STATUS_META[s]?.label ?? s)}
            </button>
          ))}
        </div>
      </div>

      {/* RFQ List Table */}
      {loading ? (
        <div suppressHydrationWarning className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-muted/30"
            />
          ))}
        </div>
      ) : isEmpty ? (
        <div
          suppressHydrationWarning
          className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center"
        >
          <FileText
            size={36}
            className="text-muted-foreground/40"
            strokeWidth={1}
          />
          <div suppressHydrationWarning>
            <p className="text-sm font-semibold text-foreground">
              No sourcing requests found
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              No RFQs match the status or search terms selected.
            </p>
          </div>
        </div>
      ) : (
        <div
          suppressHydrationWarning
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <div suppressHydrationWarning className="overflow-x-auto">
            <table
              suppressHydrationWarning
              className="w-full border-collapse text-left text-sm text-foreground"
            >
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Product Info</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRfqs.map((rfq) => {
                  const productTitle =
                    rfq.item?.product?.title ??
                    rfq.title ??
                    'Custom sourcing request';
                  return (
                    <tr
                      key={rfq.id}
                      className="group transition hover:bg-muted/40"
                    >
                      <td className="px-5 py-4 font-mono text-xs font-medium">
                        {rfq.referenceNumber}
                      </td>
                      <td className="px-5 py-4">
                        <div
                          suppressHydrationWarning
                          className="font-semibold text-foreground"
                        >
                          {rfq.buyer?.name || 'Importers Ltd'}
                        </div>
                        <div
                          suppressHydrationWarning
                          className="text-xs text-muted-foreground"
                        >
                          {rfq.buyer?.email}
                        </div>
                      </td>
                      <td className="max-w-xs truncate px-5 py-4">
                        {productTitle}
                      </td>
                      <td className="px-5 py-4 tabular-nums">
                        {rfq.item?.quantity?.toLocaleString() ?? '—'}
                      </td>
                      <td className="px-5 py-4">{rfq.destination}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={rfq.status} />
                      </td>
                      <td className="px-5 py-4 text-xs whitespace-nowrap text-muted-foreground">
                        {formatDate(rfq.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/rfqs/${rfq.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          Details
                          <ChevronRight
                            size={13}
                            className="transition-transform group-hover:translate-x-0.5"
                          />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div
          suppressHydrationWarning
          className="flex items-center justify-between pt-2"
        >
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ·{' '}
            {pagination.total} RFQ{pagination.total !== 1 ? 's' : ''}
          </p>
          <div suppressHydrationWarning className="flex gap-2">
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

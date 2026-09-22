'use client';

const STATUS_STYLES = {
  draft: 'border-slate-200 bg-slate-50 text-slate-700',
  pending: 'border-slate-200 bg-slate-50 text-slate-700',
  sent: 'border-blue-200 bg-blue-50 text-blue-700',
  accepted: 'border-green-200 bg-green-50 text-green-700',
  rejected: 'border-red-200 bg-red-50 text-red-700',
};

export default function QuotationStatusBadge({ status, expired = false }) {
  const label = expired ? 'Expired' : status;
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
        expired
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : STATUS_STYLES[status] || STATUS_STYLES.pending
      }`}
    >
      {label}
    </span>
  );
}

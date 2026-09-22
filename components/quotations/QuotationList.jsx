import Link from 'next/link';
import QuotationStatusBadge from './QuotationStatusBadge.jsx';

function formatDate(value) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatMoney(value, currency) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(
    (value || 0) / 100,
  );
}

export default function QuotationList({ quotations }) {
  if (!quotations.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        No quotations are available yet.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {quotations.map((quotation) => (
        <Link
          key={quotation.id}
          href={`/quotations/${quotation.id}`}
          className="grid gap-3 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 sm:grid-cols-[1.2fr_1fr_auto_auto] sm:items-center"
        >
          <div>
            <p className="font-mono text-sm font-semibold">
              {quotation.referenceNumber || 'Quotation'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              RFQ {quotation.rfq?.referenceNumber || quotation.rfqId}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold tabular-nums">
              {formatMoney(quotation.total, quotation.currency)}
            </p>
          </div>
          <QuotationStatusBadge
            status={quotation.status}
            expired={quotation.expired}
          />
          <span className="text-sm font-semibold text-primary">View</span>
          <p className="text-xs text-muted-foreground sm:col-span-4">
            Created {formatDate(quotation.createdAt)} · Valid until{' '}
            {quotation.expiresAt ? formatDate(quotation.expiresAt) : 'Not set'}
          </p>
        </Link>
      ))}
    </div>
  );
}

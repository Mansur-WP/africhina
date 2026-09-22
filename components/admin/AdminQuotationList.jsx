import Link from 'next/link';

function formatMoney(value, currency) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(
    (value || 0) / 100,
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function AdminQuotationList({ quotations }) {
  if (!quotations.length)
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        No quotations have been created.
      </div>
    );
  return (
    <div className="flex flex-col gap-3">
      {quotations.map((quotation) => (
        <Link
          key={quotation.id}
          href={`/admin/quotations/${quotation.id}`}
          className="grid gap-3 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center"
        >
          <div>
            <p className="font-mono text-sm font-semibold">
              {quotation.referenceNumber}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              RFQ {quotation.rfq?.referenceNumber}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Customer</p>
            <p className="text-sm font-medium">
              {quotation.rfq?.buyer?.name || quotation.rfq?.buyer?.email}
            </p>
          </div>
          <div>
            <p className="font-semibold tabular-nums">
              {formatMoney(quotation.total, quotation.currency)}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {quotation.status} · {formatDate(quotation.createdAt)}
            </p>
          </div>
          <span className="text-sm font-semibold text-primary">Open</span>
        </Link>
      ))}
    </div>
  );
}

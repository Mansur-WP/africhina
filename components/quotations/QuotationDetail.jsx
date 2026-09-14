import Link from 'next/link';
import QuotationActions from './QuotationActions.jsx';
import QuotationStatusBadge from './QuotationStatusBadge.jsx';

function formatDate(value) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function formatMoney(value, currency) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(
    (value || 0) / 100,
  );
}

const COSTS = [
  ['Product cost', 'productCost'],
  ['China domestic shipping', 'chinaShippingCost'],
  ['Inspection', 'inspectionCost'],
  ['International freight', 'internationalFreightCost'],
  ['Customs / clearance', 'customsCost'],
  ['Service fee', 'serviceFee'],
  ['Other charges', 'otherCharges'],
];

export default function QuotationDetail({ quotation }) {
  const item = quotation.rfq?.item;
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Link
        href="/quotations"
        className="text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        ← Back to Quotations
      </Link>
      <header className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-sm text-muted-foreground">
            {quotation.referenceNumber}
          </p>
          <h1 className="mt-1 text-2xl font-bold">
            Quotation for {quotation.rfq?.referenceNumber}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Created {formatDate(quotation.createdAt)} · Valid until{' '}
            {quotation.expiresAt ? formatDate(quotation.expiresAt) : 'Not set'}
          </p>
        </div>
        <QuotationStatusBadge
          status={quotation.status}
          expired={quotation.expired}
        />
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold">RFQ details</h2>
            <p className="mt-3 text-sm font-semibold">
              {item?.product?.title ||
                quotation.rfq?.title ||
                'Custom sourcing request'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Quantity: {item?.quantity ?? '—'} · Destination:{' '}
              {quotation.rfq?.destination || '—'}
            </p>
          </section>
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold">Cost breakdown</h2>
            <dl className="mt-4 divide-y divide-border">
              {COSTS.map(([label, key]) => (
                <div
                  key={key}
                  className="flex justify-between gap-4 py-3 text-sm"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium tabular-nums">
                    {formatMoney(quotation[key], quotation.currency)}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 pt-4 text-base font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  {formatMoney(quotation.total, quotation.currency)}
                </dd>
              </div>
            </dl>
          </section>
          {quotation.notes ? (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-bold">Notes</h2>
              <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">
                {quotation.notes}
              </p>
            </section>
          ) : null}
        </div>
        <aside className="flex h-fit flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <div>
            <p className="text-xs text-muted-foreground">Estimated delivery</p>
            <p className="mt-1 text-sm font-semibold">
              {quotation.deliveryEstimate || 'To be confirmed'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Currency</p>
            <p className="mt-1 text-sm font-semibold">{quotation.currency}</p>
          </div>
          <QuotationActions quotation={quotation} />
        </aside>
      </div>
    </div>
  );
}

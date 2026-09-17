'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const COST_FIELDS = [
  ['Product cost', 'productCost'],
  ['China domestic shipping', 'chinaShippingCost'],
  ['Inspection', 'inspectionCost'],
  ['International freight', 'internationalFreightCost'],
  ['Customs / clearance', 'customsCost'],
  ['Service fee', 'serviceFee'],
  ['Other charges', 'otherCharges'],
];

function minorToMajor(value) {
  return value ? String(value / 100) : '';
}

export default function QuotationForm({ rfq, quotation = null }) {
  const router = useRouter();
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      COST_FIELDS.map(([, key]) => [key, minorToMajor(quotation?.[key])]),
    ),
  );
  const [currency, setCurrency] = useState(quotation?.currency || 'NGN');
  const [deliveryEstimate, setDeliveryEstimate] = useState(
    quotation?.deliveryEstimate || '',
  );
  const [expiresAt, setExpiresAt] = useState(
    quotation?.expiresAt ? quotation.expiresAt.slice(0, 10) : '',
  );
  const [notes, setNotes] = useState(quotation?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(quotation?.status === 'draft');
  const [quotationId, setQuotationId] = useState(quotation?.id || null);

  const minorValues = Object.fromEntries(
    COST_FIELDS.map(([, key]) => [
      key,
      Math.round(Number(values[key] || 0) * 100),
    ]),
  );
  const previewTotal = Object.values(minorValues).reduce(
    (sum, value) => sum + value,
    0,
  );
  const formatPreview = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(previewTotal / 100);

  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function save(send = false) {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...minorValues,
        currency,
        deliveryEstimate,
        expiresAt: expiresAt
          ? new Date(`${expiresAt}T23:59:59.000Z`).toISOString()
          : null,
        notes: notes || null,
      };
      const endpoint = quotationId
        ? `/api/v1/admin/quotations/${quotationId}`
        : `/api/v1/admin/rfqs/${rfq.id}/quotations`;
      const response = await fetch(endpoint, {
        method: quotationId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result?.error?.message ||
            result?.message ||
            'Unable to save quotation.',
        );
      const id = result.data.id;
      setQuotationId(id);
      setSaved(true);
      if (send) {
        const sendResponse = await fetch(
          `/api/v1/admin/quotations/${id}/send`,
          { method: 'POST' },
        );
        const sendResult = await sendResponse.json();
        if (!sendResponse.ok)
          throw new Error(
            sendResult?.error?.message || 'Unable to send quotation.',
          );
      }
      router.push(`/admin/quotations/${id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">
          {quotation ? 'Edit Draft Quotation' : 'Prepare Quotation'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          RFQ {rfq.referenceNumber}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold">Customer request</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {rfq.items?.[0]?.product?.title ||
            rfq.title ||
            'Custom sourcing request'}{' '}
          · Qty {rfq.items?.[0]?.quantity ?? '—'} · {rfq.destination}
        </p>
      </div>
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save(false);
        }}
        className="flex flex-col gap-5"
      >
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold">Cost breakdown</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {COST_FIELDS.map(([label, key]) => (
              <label key={key} className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold text-muted-foreground">
                  {label} ({currency}, major units)
                </span>
                <input
                  required={key === 'productCost'}
                  min="0"
                  step="0.01"
                  type="number"
                  value={values[key]}
                  onChange={(event) => update(key, event.target.value)}
                  className="rounded-md border border-border px-3 py-2"
                />
              </label>
            ))}
          </div>
          <div className="mt-5 border-t border-border pt-4 text-right">
            <span className="text-xs text-muted-foreground">Preview total</span>
            <p className="text-2xl font-bold tabular-nums">{formatPreview}</p>
          </div>
        </section>
        <section className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold text-muted-foreground">
              Currency
            </span>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="rounded-md border border-border px-3 py-2"
            >
              <option>NGN</option>
              <option>CNY</option>
              <option>USD</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold text-muted-foreground">
              Valid until
            </span>
            <input
              required
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className="rounded-md border border-border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Estimated delivery
            </span>
            <input
              required
              value={deliveryEstimate}
              onChange={(event) => setDeliveryEstimate(event.target.value)}
              placeholder="14 working days"
              className="rounded-md border border-border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="rounded-md border border-border px-3 py-2"
            />
          </label>
        </section>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : saved ? 'Save Draft Changes' : 'Save Draft'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Save &amp; Send Quotation
          </button>
        </div>
      </form>
    </div>
  );
}

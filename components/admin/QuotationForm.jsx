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
  const quantity = rfq.items?.[0]?.quantity || 1;
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      COST_FIELDS.map(([, key]) => [key, minorToMajor(quotation?.[key])]),
    ),
  );
  const [unitPrice, setUnitPrice] = useState(() => {
    const initialProductCost = quotation?.productCost
      ? quotation.productCost / 100
      : 0;
    return initialProductCost && quantity
      ? String(Number((initialProductCost / quantity).toFixed(2)))
      : '';
  });
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
  const formatMoney = (minor) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format((minor || 0) / 100);

  const formatPreview = formatMoney(previewTotal);
  const shippingTotal =
    (minorValues.chinaShippingCost || 0) +
    (minorValues.internationalFreightCost || 0);
  const otherChargesTotal =
    (minorValues.inspectionCost || 0) +
    (minorValues.customsCost || 0) +
    (minorValues.serviceFee || 0) +
    (minorValues.otherCharges || 0);

  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === 'productCost') {
      const num = Number(value || 0);
      setUnitPrice(
        num && quantity ? String(Number((num / quantity).toFixed(2))) : '',
      );
    }
  }

  function handleUnitPriceChange(newUnitPrice) {
    setUnitPrice(newUnitPrice);
    const uPrice = Number(newUnitPrice || 0);
    const calculatedSubtotal = Number((uPrice * quantity).toFixed(2));
    setValues((current) => ({
      ...current,
      productCost: calculatedSubtotal ? String(calculatedSubtotal) : '',
    }));
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
          · Qty {quantity} · Destination: {rfq.destination}
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
        {/* Product / Supplier Cost Section */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-foreground">
            Product / Supplier Cost
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter the unit cost from the supplier or the total product subtotal.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-muted-foreground">
                Quantity (units)
              </span>
              <input
                type="text"
                disabled
                value={`${quantity} units`}
                className="rounded-md border border-border bg-muted/50 px-3 py-2 font-medium text-muted-foreground"
              />
            </div>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-muted-foreground">
                Unit price ({currency})
              </span>
              <input
                min="0"
                step="0.01"
                type="number"
                placeholder="0.00"
                value={unitPrice}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
                className="rounded-md border border-border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-muted-foreground">
                Product subtotal ({currency}) *
              </span>
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                placeholder="0.00"
                value={values.productCost}
                onChange={(e) => update('productCost', e.target.value)}
                className="rounded-md border border-border px-3 py-2 font-medium"
              />
            </label>
          </div>
        </section>

        {/* Shipping Section */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-foreground">Shipping</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-muted-foreground">
                China domestic shipping ({currency})
              </span>
              <input
                min="0"
                step="0.01"
                type="number"
                value={values.chinaShippingCost}
                onChange={(event) =>
                  update('chinaShippingCost', event.target.value)
                }
                className="rounded-md border border-border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-muted-foreground">
                International freight ({currency})
              </span>
              <input
                min="0"
                step="0.01"
                type="number"
                value={values.internationalFreightCost}
                onChange={(event) =>
                  update('internationalFreightCost', event.target.value)
                }
                className="rounded-md border border-border px-3 py-2"
              />
            </label>
          </div>
        </section>

        {/* Other Applicable Charges */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-foreground">
            Other Applicable Charges
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-muted-foreground">
                Customs / clearance ({currency})
              </span>
              <input
                min="0"
                step="0.01"
                type="number"
                value={values.customsCost}
                onChange={(event) => update('customsCost', event.target.value)}
                className="rounded-md border border-border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-muted-foreground">
                Inspection ({currency})
              </span>
              <input
                min="0"
                step="0.01"
                type="number"
                value={values.inspectionCost}
                onChange={(event) =>
                  update('inspectionCost', event.target.value)
                }
                className="rounded-md border border-border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-muted-foreground">
                Procurement / service fee ({currency})
              </span>
              <input
                min="0"
                step="0.01"
                type="number"
                value={values.serviceFee}
                onChange={(event) => update('serviceFee', event.target.value)}
                className="rounded-md border border-border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-muted-foreground">
                Other charges ({currency})
              </span>
              <input
                min="0"
                step="0.01"
                type="number"
                value={values.otherCharges}
                onChange={(event) => update('otherCharges', event.target.value)}
                className="rounded-md border border-border px-3 py-2"
              />
            </label>
          </div>

          {/* Calculation summary */}
          <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Product Subtotal</span>
              <span className="font-medium text-foreground">
                {formatMoney(minorValues.productCost)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="font-medium text-foreground">
                {formatMoney(shippingTotal)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Other Applicable Charges</span>
              <span className="font-medium text-foreground">
                {formatMoney(otherChargesTotal)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
              <span>Total Sourcing Price</span>
              <span className="text-2xl tabular-nums">{formatPreview}</span>
            </div>
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

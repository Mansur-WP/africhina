'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  Truck,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { formatMoney } from '@/src/shared/lib/money.js';

const CURRENCIES = ['NGN', 'CNY', 'USD'];

const CURRENCY_SYMBOLS = {
  NGN: '₦',
  CNY: '¥',
  USD: '$',
};

const VALID_DAYS_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '14 days (default)', value: 14 },
  { label: '21 days', value: 21 },
  { label: '30 days', value: 30 },
  { label: '45 days', value: 45 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
];

export default function QuotationForm({ rfq }) {
  const router = useRouter();

  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [deliveryEstimate, setDeliveryEstimate] = useState('');
  const [validDays, setValidDays] = useState(14);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Capture mount time once — avoids calling Date.now() on every render (ESLint purity rule)
  const [mountedAt] = useState(() => Date.now());

  // Convert human-readable price (in major units) to minor units for display
  const priceMinorUnits = Math.round(parseFloat(price || '0') * 100);
  const displayPrice = isNaN(priceMinorUnits)
    ? '₦0.00'
    : formatMoney(priceMinorUnits, currency);
  const expiryDate = new Date(
    mountedAt + validDays * 24 * 60 * 60 * 1000,
  ).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid price greater than zero.');
      return;
    }

    const priceInMinorUnits = Math.round(parsedPrice * 100);
    if (priceInMinorUnits < 100) {
      setError('Price must be at least 1.00 (100 minor units).');
      return;
    }

    if (!deliveryEstimate.trim()) {
      setError('Please specify a delivery estimate (e.g. "14 working days").');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/v1/admin/rfqs/${rfq.id}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: priceInMinorUnits,
          currency,
          deliveryEstimate: deliveryEstimate.trim(),
          notes: notes.trim() || null,
          validDays,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message ?? 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      // Give the user a moment to see the success state before redirecting
      setTimeout(() => {
        router.push(`/admin/rfqs/${rfq.id}`);
        router.refresh();
      }, 1500);
    } catch {
      setError(
        'A network error occurred. Please check your connection and try again.',
      );
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        suppressHydrationWarning
        className="flex flex-col items-center justify-center gap-4 py-20 text-center"
      >
        <div
          suppressHydrationWarning
          className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600"
        >
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Quotation Sent!</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          The quotation has been created successfully. The customer will be able
          to view and respond to it. Redirecting back to the RFQ…
        </p>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="flex max-w-2xl flex-col gap-6">
      {/* Back */}
      <Link
        href={`/admin/rfqs/${rfq.id}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={15} />
        Back to RFQ Details
      </Link>

      {/* Page header */}
      <div suppressHydrationWarning>
        <h1 className="text-2xl font-bold text-foreground">
          Prepare Quotation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a pricing offer for{' '}
          <span className="font-mono font-semibold text-foreground">
            {rfq.referenceNumber}
          </span>
        </p>
      </div>

      {/* RFQ Summary card */}
      <div
        suppressHydrationWarning
        className="flex flex-col gap-1 rounded-xl border border-border bg-muted/20 px-5 py-4"
      >
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Sourcing Request Summary
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {rfq.items?.[0]?.product?.title ??
            rfq.title ??
            'Custom sourcing request'}
        </p>
        <p className="text-xs text-muted-foreground">
          Customer: {rfq.buyer?.name ?? 'Unknown'} ({rfq.buyer?.email}){' · '}
          Qty: {rfq.items?.[0]?.quantity?.toLocaleString() ?? '—'} units
          {' · '}
          Destination: {rfq.destination}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          suppressHydrationWarning
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Price & Currency */}
        <div
          suppressHydrationWarning
          className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
        >
          <div suppressHydrationWarning className="flex items-center gap-2">
            <DollarSign size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">Pricing</h2>
          </div>

          <div
            suppressHydrationWarning
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {/* Currency select */}
            <div suppressHydrationWarning className="flex flex-col gap-1.5">
              <label
                htmlFor="currency"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-semibold transition outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCY_SYMBOLS[c]})
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div
              suppressHydrationWarning
              className="flex flex-col gap-1.5 sm:col-span-2"
            >
              <label
                htmlFor="price"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Total Price (in{' '}
                {currency === 'NGN'
                  ? 'Naira'
                  : currency === 'CNY'
                    ? 'Yuan'
                    : 'Dollars'}
                )
              </label>
              <div suppressHydrationWarning className="relative">
                <span className="absolute top-2.5 left-3 text-sm font-semibold text-muted-foreground">
                  {CURRENCY_SYMBOLS[currency]}
                </span>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full rounded-lg border border-border bg-background py-2.5 pr-4 pl-8 text-sm font-semibold tabular-nums transition outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
                />
              </div>
            </div>
          </div>

          {/* Price preview */}
          {price && parseFloat(price) > 0 && (
            <div
              suppressHydrationWarning
              className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm"
            >
              <span className="text-muted-foreground">
                Total quotation value:{' '}
              </span>
              <span className="font-bold text-primary tabular-nums">
                {displayPrice}
              </span>
            </div>
          )}
        </div>

        {/* Delivery & Validity */}
        <div
          suppressHydrationWarning
          className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
        >
          <div suppressHydrationWarning className="flex items-center gap-2">
            <Truck size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">
              Delivery Details
            </h2>
          </div>

          <div
            suppressHydrationWarning
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {/* Delivery estimate */}
            <div suppressHydrationWarning className="flex flex-col gap-1.5">
              <label
                htmlFor="deliveryEstimate"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Delivery Estimate
              </label>
              <input
                id="deliveryEstimate"
                type="text"
                value={deliveryEstimate}
                onChange={(e) => setDeliveryEstimate(e.target.value)}
                placeholder="e.g. 21–28 working days"
                maxLength={100}
                required
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
              />
            </div>

            {/* Validity period */}
            <div suppressHydrationWarning className="flex flex-col gap-1.5">
              <label
                htmlFor="validDays"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Quote Validity
              </label>
              <select
                id="validDays"
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
              >
                {VALID_DAYS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Expires: {expiryDate}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div
          suppressHydrationWarning
          className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
        >
          <div suppressHydrationWarning className="flex items-center gap-2">
            <FileText size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">
              Breakdown & Terms{' '}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </h2>
          </div>
          <div suppressHydrationWarning className="flex flex-col gap-1.5">
            <label
              htmlFor="notes"
              className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Notes
            </label>
            <textarea
              id="notes"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              placeholder="Optional: break down your sourcing and shipping costs, payment terms, or any special conditions for this quotation…"
              className="resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-relaxed transition outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {notes.length} / 2000
            </p>
          </div>
        </div>

        {/* Submit */}
        <div
          suppressHydrationWarning
          className="flex items-center justify-between gap-4 pt-1"
        >
          <Link
            href={`/admin/rfqs/${rfq.id}`}
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            id="send-quotation-btn"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            <Clock size={15} />
            {submitting ? 'Sending Quotation…' : 'Send Quotation to Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { formatMoney } from '@/src/shared/lib/money.js';

/**
 * RFQForm — client component for /rfq/new.
 *
 * Pre-populates product details when a `productId` is passed via query param
 * from the product detail page. Customers can also submit a custom (free-text)
 * product request with no catalogue product selected.
 *
 * Prevents duplicate submissions by disabling the submit button while in-flight.
 */
export default function RfqForm({ product }) {
  const router = useRouter();

  // If a product was passed, we're in product-based mode.
  const isProductMode = Boolean(product);

  const [quantity, setQuantity] = useState(
    product?.minimumOrderQty ? String(product.minimumOrderQty) : '1',
  );
  const [destination, setDestination] = useState('Kano, Nigeria');
  const [notes, setNotes] = useState('');
  const [productDescription, setProductDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(null); // { referenceNumber, id }

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (submitting) return;

      setServerError('');
      setFieldErrors({});
      setSubmitting(true);

      const payload = {
        productId: product?.id ?? null,
        productDescription: isProductMode
          ? null
          : productDescription.trim() || null,
        quantity: Number(quantity),
        destination: destination.trim(),
        notes: notes.trim() || null,
      };

      try {
        const res = await fetch('/api/v1/rfqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!res.ok) {
          if (json.error?.details) {
            const errs = {};
            for (const issue of json.error.details) {
              const key = issue.path?.[0] || 'root';
              errs[key] = issue.message;
            }
            setFieldErrors(errs);
          } else {
            setServerError(
              json.message || 'Something went wrong. Please try again.',
            );
          }
          setSubmitting(false);
          return;
        }

        setSuccess({
          referenceNumber: json.data.referenceNumber,
          id: json.data.id,
        });
      } catch {
        setServerError(
          'A network error occurred. Please check your connection and try again.',
        );
        setSubmitting(false);
      }
    },
    [
      submitting,
      product,
      isProductMode,
      productDescription,
      quantity,
      destination,
      notes,
    ],
  );

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div
        suppressHydrationWarning
        className="flex flex-col items-center gap-6 py-10 text-center"
      >
        <CheckCircle className="text-green-600" size={48} strokeWidth={1.5} />

        <div suppressHydrationWarning>
          <h1 className="text-2xl font-bold text-foreground">
            Your request has been submitted.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Reference:{' '}
            <span className="font-semibold text-foreground">
              {success.referenceNumber}
            </span>
          </p>
        </div>

        <div
          suppressHydrationWarning
          className="w-full max-w-sm rounded-lg border border-border bg-card p-5 text-left"
        >
          <h2 className="text-sm font-semibold text-foreground">
            What happens next?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Our team at Africhina Connect will review your sourcing request and
            get back to you with next steps. You can track the status of your
            request in your RFQ dashboard.
          </p>
        </div>

        <div
          suppressHydrationWarning
          className="mt-2 flex flex-col gap-3 sm:flex-row"
        >
          <Link
            href={`/rfq/${success.id}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            View My Request
          </Link>
          <Link
            href="/rfq"
            className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            All My Requests
          </Link>
          <Link
            href="/catalogue"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            Browse Catalogue
          </Link>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      <div suppressHydrationWarning className="flex items-center gap-3">
        <Link
          href={product ? `/catalogue/${product.id}` : '/catalogue'}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={15} />
          {product ? 'Back to product' : 'Browse catalogue'}
        </Link>
      </div>

      <div suppressHydrationWarning>
        <h1 className="text-2xl font-bold text-foreground">Request a Quote</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us what you need and we will source it from China for you.
        </p>
      </div>

      {serverError && (
        <div
          suppressHydrationWarning
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {serverError}
        </div>
      )}

      {/* ── Product display (product-mode) ───────────────────────────────── */}
      {isProductMode ? (
        <div
          suppressHydrationWarning
          className="flex items-start gap-4 rounded-lg border border-border bg-card p-4"
        >
          {product.images?.[0] && (
            <div
              suppressHydrationWarning
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border"
            >
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt || product.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          )}
          <div suppressHydrationWarning className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Selected product
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
              {product.title}
            </p>
            {product.category && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {product.category.name}
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              Indicative price: {formatMoney(product.price, product.currency)}
            </p>
          </div>
        </div>
      ) : (
        /* ── Custom product request mode ──────────────────────────────── */
        <div suppressHydrationWarning className="flex flex-col gap-1.5">
          <label
            className="text-sm font-semibold text-foreground"
            htmlFor="rfq-product-description"
          >
            What product are you looking for?{' '}
            <span className="text-destructive">*</span>
          </label>
          <input
            id="rfq-product-description"
            type="text"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            placeholder="e.g. Wireless Bluetooth Earbuds, USB-C charging cable…"
            required
            maxLength={200}
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm transition outline-none focus:border-ring"
          />
          {fieldErrors.productDescription && (
            <p className="text-xs text-destructive">
              {fieldErrors.productDescription}
            </p>
          )}
        </div>
      )}

      {/* ── Quantity ──────────────────────────────────────────────────────── */}
      <div suppressHydrationWarning className="flex flex-col gap-1.5">
        <label
          className="text-sm font-semibold text-foreground"
          htmlFor="rfq-quantity"
        >
          How many do you need? <span className="text-destructive">*</span>
        </label>
        {product?.minimumOrderQty && (
          <p className="text-xs text-muted-foreground">
            Minimum order:{' '}
            <span className="font-medium tabular-nums">
              {product.minimumOrderQty}
            </span>{' '}
            units
          </p>
        )}
        <input
          id="rfq-quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min={1}
          max={100000}
          required
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm transition outline-none focus:border-ring"
        />
        {fieldErrors.quantity && (
          <p className="text-xs text-destructive">{fieldErrors.quantity}</p>
        )}
      </div>

      {/* ── Destination ───────────────────────────────────────────────────── */}
      <div suppressHydrationWarning className="flex flex-col gap-1.5">
        <label
          className="text-sm font-semibold text-foreground"
          htmlFor="rfq-destination"
        >
          Where should we source / deliver this to?{' '}
          <span className="text-destructive">*</span>
        </label>
        <input
          id="rfq-destination"
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="e.g. Kano, Nigeria"
          required
          maxLength={200}
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm transition outline-none focus:border-ring"
        />
        {fieldErrors.destination && (
          <p className="text-xs text-destructive">{fieldErrors.destination}</p>
        )}
      </div>

      {/* ── Notes / requirements ──────────────────────────────────────────── */}
      <div suppressHydrationWarning className="flex flex-col gap-1.5">
        <label
          className="text-sm font-semibold text-foreground"
          htmlFor="rfq-notes"
        >
          Tell us anything important about the product.{' '}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <p className="text-xs text-muted-foreground">
          For example: preferred colour, size, model, packaging, quality
          requirements…
        </p>
        <textarea
          id="rfq-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="e.g. Black colour preferred, with retail packaging. Minimum 1-year warranty."
          className="w-full resize-y rounded-lg border border-border px-3 py-2.5 text-sm transition outline-none focus:border-ring"
        />
        <p className="text-right text-xs text-muted-foreground">
          {notes.length} / 2000
        </p>
        {fieldErrors.notes && (
          <p className="text-xs text-destructive">{fieldErrors.notes}</p>
        )}
      </div>

      {/* ── Attachments notice ────────────────────────────────────────────── */}
      <div
        suppressHydrationWarning
        className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground"
      >
        <strong>Attachments</strong> — file upload will be available in a future
        update. For now, please describe your requirements in the notes field
        above.
      </div>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <div
        suppressHydrationWarning
        className="flex flex-col gap-3 pt-2 sm:flex-row"
      >
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
        <Link
          href={product ? `/catalogue/${product.id}` : '/catalogue'}
          className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

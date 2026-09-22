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
            Your Sourcing Request Has Been Submitted
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
          className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-left"
        >
          <h2 className="text-sm font-semibold text-foreground">
            What happens next?
          </h2>
          <ol className="mt-3 flex flex-col gap-2.5 text-xs leading-relaxed text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                1
              </span>
              <span>
                <strong>Specification Review:</strong> Our sourcing team reviews
                your requirements and identifies vetted manufacturers in China.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                2
              </span>
              <span>
                <strong>Offer Received:</strong> You will receive a sourcing
                offer with confirmed product cost, freight, and estimated
                delivery timeline.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                3
              </span>
              <span>
                <strong>Accept & Pay:</strong> Review and accept the offer to
                generate your order and proceed to payment.
              </span>
            </li>
          </ol>
        </div>

        <div
          suppressHydrationWarning
          className="mt-2 flex flex-col gap-3 sm:flex-row"
        >
          <Link
            href={`/rfq/${success.id}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            View Sourcing Request
          </Link>
          <Link
            href="/rfq"
            className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            All Sourcing Requests
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
        <h1 className="text-2xl font-bold text-foreground">
          Request Custom Sourcing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us what product you need and our sourcing team in China will find
          verified suppliers and prepare a detailed offer for you.
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
              Selected Product for Sourcing
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
            placeholder="e.g. Wireless Bluetooth Earbuds, USB-C fast charger, Solar Inverter 5kVA…"
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
          Quantity required <span className="text-destructive">*</span>
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
          Delivery destination (Nigeria){' '}
          <span className="text-destructive">*</span>
        </label>
        <input
          id="rfq-destination"
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="e.g. Lagos, Abuja, Kano, Port Harcourt…"
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
          Product specifications & requirements{' '}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <p className="text-xs text-muted-foreground">
          Include details such as preferred materials, dimensions, packaging,
          branding/OEM requirements, or certification standards.
        </p>
        <textarea
          id="rfq-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="e.g. Matte black finish, EU standard plug, customized logo on packaging. Target lead time 30 days."
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
          {submitting
            ? 'Submitting Sourcing Request…'
            : 'Submit Sourcing Request'}
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

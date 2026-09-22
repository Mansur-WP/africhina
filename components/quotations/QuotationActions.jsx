'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuotationActions({ quotation }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function decide(action) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(
        `/api/v1/quotations/${quotation.id}/${action}`,
        { method: 'POST' },
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(
          payload?.error?.message ||
            payload?.message ||
            'Unable to update quotation.',
        );
        return;
      }
      if (action === 'accept' && payload.data?.order?.id) {
        router.push(`/orders/${payload.data.order.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setError('A network error occurred.');
    } finally {
      setBusy(false);
    }
  }

  const isFinancialDataReady = Boolean(
    quotation.total &&
    quotation.total > 0 &&
    quotation.productCost &&
    quotation.productCost > 0,
  );

  if (
    quotation.status !== 'sent' ||
    quotation.expired ||
    !isFinancialDataReady
  ) {
    if (quotation.expired && quotation.status === 'sent') {
      return (
        <p className="text-sm font-medium text-amber-700">
          This quotation has expired and can no longer be accepted.
        </p>
      );
    }
    if (!isFinancialDataReady && quotation.status === 'sent') {
      return (
        <p className="text-sm font-medium text-amber-700">
          This quotation is missing required pricing details and cannot be
          accepted yet.
        </p>
      );
    }
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button
          disabled={busy}
          onClick={() => decide('accept')}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? 'Updating...' : 'Accept Quotation'}
        </button>
        <button
          disabled={busy}
          onClick={() => decide('reject')}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
        >
          Reject Quotation
        </button>
      </div>
    </div>
  );
}

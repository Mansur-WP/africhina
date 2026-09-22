'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  X,
  ShieldCheck,
  Download,
  Loader2,
} from 'lucide-react';
import { formatMoney } from '@/src/shared/lib/money.js';

function formatInvoiceDate(value) {
  try {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

export default function InvoiceModal({ orderId, onClose, endpoint = null }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUrl = endpoint || `/api/v1/orders/${orderId}/invoice`;

  useEffect(() => {
    let isMounted = true;
    async function loadInvoice() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(fetchUrl);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.error?.message || data?.message || 'Failed to load invoice.',
          );
        }
        if (isMounted) {
          setInvoice(data.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInvoice();

    return () => {
      isMounted = false;
    };
  }, [fetchUrl]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:fixed print:inset-0 print:bg-white print:p-0">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl print:max-h-none print:w-full print:border-none print:shadow-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Official Invoice
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !invoice}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close invoice modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 text-sm print:overflow-visible print:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="mt-3 text-xs font-medium">
                Loading invoice details…
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              <p className="font-semibold">Unable to display invoice</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : invoice ? (
            <div className="space-y-6">
              {/* Invoice Top Meta */}
              <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight text-primary">
                      AFRICHINA CONNECT
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Direct Purchase Official Receipt & Invoice
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="font-mono text-sm font-bold text-foreground">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Issued: {formatInvoiceDate(invoice.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Order Ref:{' '}
                    <span className="font-mono font-medium">
                      {invoice.orderNumber}
                    </span>
                  </p>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/20 p-3.5">
                  <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    Billed To
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {invoice.buyer?.name || 'Customer'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.buyer?.email}
                  </p>
                  {invoice.buyer?.phone ? (
                    <p className="text-xs text-muted-foreground">
                      {invoice.buyer.phone}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-3.5">
                  <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    Delivery Address
                  </p>
                  <p className="mt-1 text-xs text-foreground">
                    {invoice.shippingAddress || 'Standard Destination'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-3.5 py-2.5">Item</th>
                      <th className="px-3.5 py-2.5 text-center">Qty</th>
                      <th className="px-3.5 py-2.5 text-right">Unit Price</th>
                      <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoice.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3.5 py-2.5 font-medium text-foreground">
                          {item.productTitle}
                        </td>
                        <td className="px-3.5 py-2.5 text-center text-foreground tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-muted-foreground tabular-nums">
                          {formatMoney(
                            item.unitPrice,
                            item.currency || invoice.currency,
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-semibold text-foreground tabular-nums">
                          {formatMoney(
                            item.subtotal,
                            item.currency || invoice.currency,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payment & Totals */}
              <div className="flex flex-col justify-between gap-4 border-t border-border pt-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <div className="text-xs">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Payment Verified via Paystack
                    </p>
                    {invoice.payment?.providerRef ? (
                      <p className="font-mono text-[11px] text-muted-foreground">
                        Ref: {invoice.payment.providerRef}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-baseline justify-between gap-4 text-right sm:justify-end">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Total Paid:
                  </span>
                  <span className="text-lg font-black text-foreground tabular-nums">
                    {formatMoney(invoice.totalAmount, invoice.currency)}
                  </span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="border-t border-border pt-3 text-center text-[10px] text-muted-foreground">
                <p>Thank you for your order with Africhina Connect.</p>
                <p className="mt-0.5">
                  This invoice serves as your official proof of payment.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

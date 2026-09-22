import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  Package,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { listAllRfqsAdmin } from '@/src/application/rfqs/rfqService.js';
import { getAdminQuotationStats } from '@/src/application/rfqs/quotationService.js';

export const metadata = {
  title: 'Admin Dashboard | Africhina Connect',
  description: 'Manage platform sourcing requests, quotations, and catalog.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_COLORS = {
  open: 'text-amber-700 bg-amber-50 border-amber-200',
  quoted: 'text-blue-700 bg-blue-50 border-blue-200',
  accepted: 'text-green-700 bg-green-50 border-green-200',
  closed: 'text-gray-600 bg-gray-50 border-gray-200',
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'admin') redirect('/403');

  // Fetch all RFQs for admin metrics
  const [{ rfqs: recentRfqs, pagination }, quotationStats] = await Promise.all([
    listAllRfqsAdmin({ page: 1, limit: 10 }),
    getAdminQuotationStats(),
  ]);

  const openCount = recentRfqs.filter((r) => r.status === 'open').length;

  return (
    <AppShell>
      <div suppressHydrationWarning className="space-y-6">
        {/* Header */}
        <div suppressHydrationWarning className="border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <ShieldCheck size={12} /> Admin
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of platform RFQs, quotations, and customer sourcing
            activity.
          </p>
        </div>

        {/* Metric / KPI Cards */}
        <div
          suppressHydrationWarning
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            {
              label: 'Pending RFQs',
              value: String(openCount),
              sub: 'Awaiting quotation',
              href: '/admin/rfqs?status=open',
              Icon: Clock,
              color: 'text-amber-600',
            },
            {
              label: 'Quotations Issued',
              value: String(quotationStats.issued),
              sub: 'Awaiting buyer decision',
              href: '/admin/rfqs?status=quoted',
              Icon: FileText,
              color: 'text-blue-600',
            },
            {
              label: 'Accepted Quotes',
              value: String(quotationStats.accepted),
              sub: 'Ready for order milestone',
              href: '/admin/rfqs?status=accepted',
              Icon: CheckCircle2,
              color: 'text-green-600',
            },
            {
              label: 'Total Requests',
              value: String(pagination.total ?? 0),
              sub: 'All-time platform RFQs',
              href: '/admin/rfqs',
              Icon: Package,
              color: 'text-foreground',
            },
          ].map((m) => (
            <Link
              key={m.label}
              href={m.href}
              suppressHydrationWarning
              className="block rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {m.label}
                </span>
                <m.Icon size={18} className={m.color} />
              </div>
              <span className="mt-2 block text-3xl font-bold text-foreground tabular-nums">
                {m.value}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {m.sub}
              </span>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div
          suppressHydrationWarning
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <Link
            href="/admin/products"
            className="flex items-center gap-3 rounded-xl border border-border bg-primary/5 px-5 py-4 transition hover:border-primary/30 hover:bg-primary/10"
          >
            <div
              suppressHydrationWarning
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <Package size={18} />
            </div>
            <div suppressHydrationWarning>
              <p className="text-sm font-semibold text-foreground">
                Manage Products
              </p>
              <p className="text-xs text-muted-foreground">
                Create, edit, adjust stock, and publish direct sale products
              </p>
            </div>
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Package size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Manage Orders
              </p>
              <p className="text-xs text-muted-foreground">
                Review and track customer order state
              </p>
            </div>
          </Link>
          <Link
            href="/admin/rfqs"
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div
              suppressHydrationWarning
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"
            >
              <FileText size={18} />
            </div>
            <div suppressHydrationWarning>
              <p className="text-sm font-semibold text-foreground">
                Sourcing Requests
              </p>
              <p className="text-xs text-muted-foreground">
                Review RFQs, prepare quotes, and track customer responses
              </p>
            </div>
          </Link>
          <Link
            href="/catalogue"
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div
              suppressHydrationWarning
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"
            >
              <Package size={18} />
            </div>
            <div suppressHydrationWarning>
              <p className="text-sm font-semibold text-foreground">
                View Catalogue
              </p>
              <p className="text-xs text-muted-foreground">
                Browse customer-facing catalogue
              </p>
            </div>
          </Link>
        </div>

        {/* Recent RFQs Table */}
        <div
          suppressHydrationWarning
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <div
            suppressHydrationWarning
            className="flex items-center justify-between border-b border-border px-5 py-4"
          >
            <div
              suppressHydrationWarning
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <FileText size={16} className="text-muted-foreground" />
              Recent Sourcing Requests
            </div>
            <Link
              href="/admin/rfqs"
              className="text-xs text-primary hover:underline"
            >
              View all RFQs →
            </Link>
          </div>

          {recentRfqs.length === 0 ? (
            <div
              suppressHydrationWarning
              className="flex flex-col items-center gap-3 px-5 py-10 text-center"
            >
              <FileText
                size={32}
                className="text-muted-foreground/30"
                strokeWidth={1}
              />
              <p className="text-sm text-muted-foreground">
                No sourcing requests found.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentRfqs.map((rfq) => {
                const productTitle =
                  rfq.item?.product?.title ?? rfq.title ?? 'Custom request';
                const qty = rfq.item?.quantity;
                const buyerName =
                  rfq.buyer?.name || rfq.buyer?.email || 'Customer';
                return (
                  <Link
                    key={rfq.id}
                    href={`/admin/rfqs/${rfq.id}`}
                    className="group flex items-center justify-between px-5 py-3.5 transition hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {productTitle}
                        </p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[rfq.status] ?? ''}`}
                        >
                          {rfq.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <span className="font-mono">{rfq.referenceNumber}</span>
                        {' · Customer: '}
                        <span className="font-medium text-foreground">
                          {buyerName}
                        </span>
                        {qty && <span> · Qty {qty.toLocaleString()}</span>}
                      </p>
                    </div>
                    <ChevronRight
                      size={15}
                      className="shrink-0 text-muted-foreground transition group-hover:text-foreground"
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

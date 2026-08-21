import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ShoppingBag,
  Plus,
  ChevronRight,
  Clock,
  Package,
} from 'lucide-react';
import { listMyRfqs } from '@/src/application/rfqs/rfqService.js';

export const metadata = {
  title: 'Dashboard',
};

const STATUS_COLORS = {
  open: 'text-amber-700 bg-amber-50',
  quoted: 'text-blue-700 bg-blue-50',
  accepted: 'text-green-700 bg-green-50',
  closed: 'text-gray-600 bg-gray-50',
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/403');

  // Fetch recent RFQs and count active ones
  const { rfqs: recentRfqs, pagination } = await listMyRfqs(user.id, {
    page: 1,
    limit: 5,
  });

  const openCount = recentRfqs.filter((r) => r.status === 'open').length;

  return (
    <AppShell>
      <div suppressHydrationWarning className="space-y-6">
        {/* Welcome */}
        <div suppressHydrationWarning className="border-b border-border pb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user.name || 'Buyer'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here is an overview of your sourcing activity.
          </p>
        </div>

        {/* Metric Cards */}
        <div
          suppressHydrationWarning
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[
            {
              label: 'Active Requests',
              value: String(openCount),
              sub: 'Awaiting quotation',
              href: '/rfq?status=open',
            },
            {
              label: 'Total Requests',
              value: String(pagination.total ?? 0),
              sub: 'All-time sourcing requests',
              href: '/rfq',
            },
            {
              label: 'Open Orders',
              value: '0',
              sub: 'In production or shipping',
              href: '/orders',
            },
          ].map((m) => (
            <Link
              key={m.label}
              href={m.href}
              suppressHydrationWarning
              className="block rounded-lg border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
            >
              <span className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {m.label}
              </span>
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
            href="/rfq/new"
            className="flex items-center gap-3 rounded-xl border border-border bg-primary/5 px-5 py-4 transition hover:border-primary/30 hover:bg-primary/10"
          >
            <div
              suppressHydrationWarning
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <Plus size={18} />
            </div>
            <div suppressHydrationWarning>
              <p className="text-sm font-semibold text-foreground">
                New Sourcing Request
              </p>
              <p className="text-xs text-muted-foreground">
                Submit an RFQ for any product
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
                Browse Catalogue
              </p>
              <p className="text-xs text-muted-foreground">
                Discover products from China
              </p>
            </div>
          </Link>
        </div>

        {/* Recent RFQs */}
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
              Recent Requests
            </div>
            <Link href="/rfq" className="text-xs text-primary hover:underline">
              View all →
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
                No sourcing requests yet.
              </p>
              <Link
                href="/rfq/new"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <Plus size={12} /> Submit first request
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentRfqs.map((rfq) => {
                const productTitle =
                  rfq.item?.product?.title ?? rfq.title ?? 'Custom request';
                const qty = rfq.item?.quantity;
                return (
                  <Link
                    key={rfq.id}
                    href={`/rfq/${rfq.id}`}
                    className="group flex items-center justify-between px-5 py-3.5 transition hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {productTitle}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <span className="font-mono">{rfq.referenceNumber}</span>
                        {qty && <span> · Qty {qty.toLocaleString()}</span>}
                        {' · '}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[rfq.status] ?? ''}`}
                        >
                          {rfq.status}
                        </span>
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

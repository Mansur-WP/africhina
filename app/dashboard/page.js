import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  CreditCard,
  Package,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
} from 'lucide-react';
import AppShell from '@/components/AppShell.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import {
  listCustomerOrders,
  getCustomerOrderStats,
} from '@/src/application/orders/orderService.js';
import { getCart } from '@/src/application/cart/cartService.js';
import { formatMoney } from '@/src/shared/lib/money.js';

export const metadata = {
  title: 'Dashboard — Africhina Connect',
};

const ORDER_STATUS_CONFIG = {
  pending_payment: {
    label: 'Payment Required',
    className:
      'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  draft: {
    label: 'Draft Review',
    className:
      'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  paid: {
    label: 'Confirmed',
    className:
      'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  in_progress: {
    label: 'Preparing',
    className:
      'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  },
  shipped: {
    label: 'Shipped',
    className:
      'text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  },
  delivered: {
    label: 'Delivered',
    className:
      'text-green-700 bg-green-50 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  },
  cancelled: {
    label: 'Cancelled',
    className:
      'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  },
};

function formatDate(dateStr) {
  try {
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/403');

  const [orderStats, ordersData, cart] = await Promise.all([
    getCustomerOrderStats(user.id),
    listCustomerOrders(user.id, { page: 1, limit: 5 }).catch(() => ({
      orders: [],
      pagination: { total: 0, page: 1, limit: 5, totalPages: 0 },
    })),
    getCart(user.id).catch(() => ({ items: [] })),
  ]);

  const recentOrders = ordersData.orders ?? [];
  const cartItemCount = cart.items?.length ?? 0;

  return (
    <AppShell>
      <div suppressHydrationWarning className="space-y-8">
        {/* Welcome Header */}
        <div suppressHydrationWarning className="border-b border-border pb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user.name || 'Customer'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your orders, payments, and product purchases from one place.
          </p>
        </div>

        {/* Metric Cards */}
        <div
          suppressHydrationWarning
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <Link
            href="/orders"
            className="group block rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold tracking-wider uppercase">
                Active Orders
              </span>
              <Package size={16} className="text-muted-foreground/70" />
            </div>
            <span className="mt-3 block text-3xl font-extrabold text-foreground tabular-nums">
              {orderStats.active}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              In progress or transit
            </span>
          </Link>

          <Link
            href="/orders"
            className={`group block rounded-xl border p-5 transition hover:shadow-sm ${
              orderStats.pendingPayment > 0
                ? 'border-amber-300 bg-amber-50/40 hover:border-amber-400 dark:border-amber-800/60 dark:bg-amber-950/20'
                : 'border-border bg-card hover:border-primary/40'
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold tracking-wider uppercase">
                Payment Required
              </span>
              <CreditCard
                size={16}
                className="text-amber-600 dark:text-amber-400"
              />
            </div>
            <span className="mt-3 block text-3xl font-extrabold text-foreground tabular-nums">
              {orderStats.pendingPayment}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Awaiting checkout
            </span>
          </Link>

          <Link
            href="/catalogue"
            className="group block rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold tracking-wider uppercase">
                Catalogue
              </span>
              <ShoppingBag size={16} className="text-muted-foreground/70" />
            </div>
            <span className="mt-3 block text-3xl font-extrabold text-foreground tabular-nums">
              Store
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Direct-sale products
            </span>
          </Link>

          <Link
            href="/cart"
            className="group block rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold tracking-wider uppercase">
                Cart Items
              </span>
              <ShoppingBag size={16} className="text-muted-foreground/70" />
            </div>
            <span className="mt-3 block text-3xl font-extrabold text-foreground tabular-nums">
              {cartItemCount}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Ready for checkout
            </span>
          </Link>
        </div>

        {/* Quick Actions */}
        <div
          suppressHydrationWarning
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <Link
            href="/catalogue"
            className="flex items-center gap-3.5 rounded-xl border border-border bg-card px-5 py-4 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Browse Products
              </p>
              <p className="text-xs text-muted-foreground">
                Direct-sale products from China
              </p>
            </div>
          </Link>

          <Link
            href="/cart"
            className="flex items-center gap-3.5 rounded-xl border border-border bg-card px-5 py-4 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Shopping Cart
              </p>
              <p className="text-xs text-muted-foreground">
                Review items & checkout
              </p>
            </div>
          </Link>

          <Link
            href="/orders"
            className="flex items-center gap-3.5 rounded-xl border border-border bg-card px-5 py-4 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Track Orders
              </p>
              <p className="text-xs text-muted-foreground">
                View status & payment details
              </p>
            </div>
          </Link>
        </div>

        {/* Primary Section: Recent Orders */}
        <div
          suppressHydrationWarning
          className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Package size={17} className="text-primary" />
              <h2 className="text-base font-bold text-foreground">
                Recent Orders
              </h2>
            </div>
            <Link
              href="/orders"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
              <Package
                size={36}
                className="text-muted-foreground/40"
                strokeWidth={1.5}
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  No orders placed yet
                </p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Your purchases and orders will appear here for tracking,
                  invoice viewing, and payment.
                </p>
              </div>
              <Link
                href="/catalogue"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => {
                const statusMeta = ORDER_STATUS_CONFIG[order.status] ?? {
                  label: order.status.replace('_', ' '),
                  className: 'text-gray-600 bg-gray-50 border-gray-200',
                };
                const firstItemTitle =
                  order.items[0]?.productTitle ||
                  order.items[0]?.product?.title ||
                  'Direct sale order';
                const itemCount = order.items.length;
                const isPending =
                  order.status === 'pending_payment' ||
                  order.status === 'draft';

                return (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 px-5 py-4 transition hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Direct
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-foreground">
                        {firstItemTitle}
                        {itemCount > 1 ? ` + ${itemCount - 1} more` : ''}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-bold text-foreground tabular-nums">
                          {formatMoney(order.totalAmount, order.currency)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {itemCount} item{itemCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Link
                        href={
                          isPending
                            ? `/checkout/${order.id}`
                            : `/orders/${order.id}`
                        }
                        className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isPending
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'border border-border bg-card text-foreground hover:bg-muted'
                        }`}
                      >
                        <span>{isPending ? 'Pay Now' : 'View Order'}</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

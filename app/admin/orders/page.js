import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell.jsx';
import AdminOrderList from '@/components/admin/AdminOrderList.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import {
  listAdminOrders,
  getAdminOrdersStats,
} from '@/src/application/orders/orderService.js';

export const metadata = {
  title: 'Order Management — Africhina Connect Admin',
};

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'admin') redirect('/403');

  const [{ orders }, stats] = await Promise.all([
    listAdminOrders({ page: 1, limit: 50 }),
    getAdminOrdersStats(),
  ]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 border-b border-border pb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Order Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, fulfil, and track all customer orders. Use filters to find
            orders by status.
          </p>
        </div>
        <AdminOrderList initialOrders={orders} initialStats={stats} />
      </div>
    </AppShell>
  );
}

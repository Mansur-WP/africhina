import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell.jsx';
import OrderList from '@/components/orders/OrderList.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { listAdminOrders } from '@/src/application/orders/orderService.js';

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'admin') redirect('/403');
  const { orders } = await listAdminOrders({ page: 1, limit: 20 });
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Review customer orders and checkout state.
        </p>
        <OrderList orders={orders} admin />
      </div>
    </AppShell>
  );
}

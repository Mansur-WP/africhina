import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import EmptyState from '@/components/EmptyState.jsx';
import OrderList from '@/components/orders/OrderList.jsx';
import { listCustomerOrders } from '@/src/application/orders/orderService.js';

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/403');
  const { orders } = await listCustomerOrders(user.id, { page: 1, limit: 20 });
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-semibold">My Orders</h1>
        <div className="mt-6">
          <OrderList orders={orders} />
        </div>
      </div>
    </AppShell>
  );
}

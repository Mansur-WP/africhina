import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import OrderList from '@/components/orders/OrderList.jsx';
import { listCustomerOrders } from '@/src/application/orders/orderService.js';

export const metadata = {
  title: 'My Orders — Africhina Connect',
};

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/403');
  const { orders } = await listCustomerOrders(user.id, { page: 1, limit: 20 });

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="border-b border-border pb-6">
          <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track, review, and manage your direct purchases and sourcing
            imports.
          </p>
        </div>
        <div className="mt-6">
          <OrderList orders={orders} />
        </div>
      </div>
    </AppShell>
  );
}

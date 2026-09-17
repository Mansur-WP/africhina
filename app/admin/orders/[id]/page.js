import { notFound, redirect } from 'next/navigation';
import AppShell from '@/components/AppShell.jsx';
import OrderDetail from '@/components/orders/OrderDetail.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { getAdminOrder } from '@/src/application/orders/orderService.js';

export default async function AdminOrderPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'admin') redirect('/403');
  const order = await getAdminOrder((await params).id);
  if (!order) notFound();
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <OrderDetail order={order} admin />
      </div>
    </AppShell>
  );
}

import { notFound, redirect } from 'next/navigation';
import AppShell from '@/components/AppShell.jsx';
import OrderDetail from '@/components/orders/OrderDetail.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { getCustomerOrder } from '@/src/application/orders/orderService.js';

export default async function OrderPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/403');
  const order = await getCustomerOrder((await params).id, user.id);
  if (!order) notFound();
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <OrderDetail order={order} />
      </div>
    </AppShell>
  );
}

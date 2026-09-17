import { redirect, notFound } from 'next/navigation';
import AppShell from '@/components/AppShell.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { getCustomerOrder } from '@/src/application/orders/orderService.js';

export default async function PaymentCallbackPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/403');
  const order = await getCustomerOrder((await params).id, user.id);
  if (!order) notFound();

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold">Payment return received</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your payment return was received. Payment confirmation will be
          completed by the payment provider and is not determined by this
          browser page.
        </p>
        <p className="mt-6 text-sm font-medium">
          Order {order.orderNumber} remains {order.status.replace('_', ' ')}{' '}
          until provider confirmation is received.
        </p>
      </div>
    </AppShell>
  );
}

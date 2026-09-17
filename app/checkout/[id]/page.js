import { notFound, redirect } from 'next/navigation';
import AppShell from '@/components/AppShell.jsx';
import OrderDetail from '@/components/orders/OrderDetail.jsx';
import CheckoutConfirmation from '@/components/orders/CheckoutConfirmation.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { getCustomerOrder } from '@/src/application/orders/orderService.js';

export default async function CheckoutPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/403');
  const order = await getCustomerOrder((await params).id, user.id);
  if (!order) notFound();
  return (
    <AppShell>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">Checkout confirmation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review your order before proceeding to payment.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <OrderDetail order={order} />
          <CheckoutConfirmation order={order} />
        </div>
      </div>
    </AppShell>
  );
}

import { redirect, notFound } from 'next/navigation';
import AppShell from '@/components/AppShell.jsx';
import PaymentCallback from '@/components/orders/PaymentCallback.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { getCustomerOrder } from '@/src/application/orders/orderService.js';

export default async function PaymentCallbackPage({ params, searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/403');

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const order = await getCustomerOrder(resolvedParams.id, user.id);
  if (!order) notFound();

  const reference =
    resolvedSearchParams?.reference || resolvedSearchParams?.trxref || null;

  return (
    <AppShell>
      <PaymentCallback initialOrder={order} reference={reference} />
    </AppShell>
  );
}

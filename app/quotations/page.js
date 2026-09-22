import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell.jsx';
import QuotationList from '@/components/quotations/QuotationList.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { listCustomerQuotations } from '@/src/application/rfqs/quotationService.js';

export const metadata = { title: 'Quotations' };

export default async function QuotationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/403');
  const { quotations } = await listCustomerQuotations(user.id, {
    page: 1,
    limit: 20,
  });
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Quotations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review pricing offers for your sourcing requests.
          </p>
        </div>
        <QuotationList quotations={quotations} />
      </div>
    </AppShell>
  );
}

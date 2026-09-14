import { notFound, redirect } from 'next/navigation';
import AppShell from '@/components/AppShell.jsx';
import QuotationDetail from '@/components/quotations/QuotationDetail.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { getQuotationById } from '@/src/application/rfqs/quotationService.js';

export default async function QuotationPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/403');
  const quotation = await getQuotationById((await params).id, user.id);
  if (!quotation) notFound();
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <QuotationDetail quotation={quotation} />
      </div>
    </AppShell>
  );
}

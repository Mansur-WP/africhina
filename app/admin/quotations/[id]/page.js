import { notFound, redirect } from 'next/navigation';
import AppShell from '@/components/AppShell.jsx';
import QuotationForm from '@/components/admin/QuotationForm.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { getAdminQuotationById } from '@/src/application/rfqs/quotationService.js';

export default async function AdminQuotationPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'admin') redirect('/403');
  const quotation = await getAdminQuotationById((await params).id);
  if (!quotation) notFound();
  if (quotation.status !== 'draft') {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="font-mono text-sm text-muted-foreground">
              {quotation.referenceNumber}
            </p>
            <h1 className="mt-2 text-2xl font-bold">Quotation Details</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This quotation is {quotation.status} and its financial values are
              finalized.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }
  const rfq = {
    ...quotation.rfq,
    items: quotation.rfq?.item ? [quotation.rfq.item] : [],
  };
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <QuotationForm rfq={rfq} quotation={quotation} />
      </div>
    </AppShell>
  );
}

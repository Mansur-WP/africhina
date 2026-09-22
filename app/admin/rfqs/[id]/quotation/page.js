import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import QuotationForm from '@/components/admin/QuotationForm.jsx';
import { getAdminRfqById } from '@/src/application/rfqs/rfqService.js';

/**
 * SCR-040 — Create Quotation Page (Admin)
 *
 * Renders the quotation preparation form for a specific RFQ.
 * Only admins can access this page.
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Create Quotation — Admin | Africhina Connect`,
    description: `Prepare and send a quotation for RFQ ${id}.`,
  };
}

export default async function CreateQuotationPage({ params }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'admin') redirect('/403');

  const rfq = await getAdminRfqById(id);
  if (!rfq) notFound();

  // Only allow quoting for eligible RFQs
  if (rfq.status !== 'open' && rfq.status !== 'quoted') {
    redirect(`/admin/rfqs/${id}`);
  }

  return (
    <AppShell>
      <div suppressHydrationWarning className="mx-auto max-w-3xl px-4 py-8">
        <QuotationForm rfq={rfq} />
      </div>
    </AppShell>
  );
}

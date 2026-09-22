import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import AdminRfqDetail from '@/components/admin/AdminRfqDetail.jsx';
import { getAdminRfqById } from '@/src/application/rfqs/rfqService.js';

/**
 * SCR-039 — Admin RFQ Detail Page
 *
 * Shows a single RFQ with full customer information, sourcing details,
 * quotation history, and a "Create Quotation" action CTA.
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `RFQ Details — Admin | Africhina Connect`,
    description: `Review sourcing request and prepare a quotation for RFQ ${id}.`,
  };
}

export default async function AdminRfqDetailPage({ params }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'admin') redirect('/403');

  const rfq = await getAdminRfqById(id);
  if (!rfq) notFound();

  return (
    <AppShell>
      <div suppressHydrationWarning className="mx-auto max-w-5xl px-4 py-8">
        <AdminRfqDetail rfq={rfq} />
      </div>
    </AppShell>
  );
}

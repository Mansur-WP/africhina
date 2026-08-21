import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import RfqDetail from '@/components/rfq/RfqDetail.jsx';
import { getMyRfqById } from '@/src/application/rfqs/rfqService.js';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Request ${id.slice(0, 8).toUpperCase()} — My Requests`,
  };
}

/**
 * SCR-016 — RFQ Detail (/rfq/[id])
 *
 * Fetches the RFQ server-side with full ownership enforcement. Returns 404
 * for missing, soft-deleted, or other customers' RFQs.
 */
export default async function RfqDetailPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/dashboard');

  const { id } = await params;
  const rfq = await getMyRfqById(id, user.id);

  if (!rfq) notFound();

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <RfqDetail rfq={rfq} />
      </div>
    </AppShell>
  );
}

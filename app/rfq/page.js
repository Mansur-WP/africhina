import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import RfqList from '@/components/rfq/RfqList.jsx';
import { listMyRfqs } from '@/src/application/rfqs/rfqService.js';

export const metadata = {
  title: 'Sourcing Requests',
};

/**
 * SCR-015 — My RFQs  (/rfq)
 *
 * Server-renders the initial list of RFQs; subsequent filter/pagination
 * changes are handled client-side via the RfqList component.
 */
export default async function MyRfqsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/dashboard');

  const { rfqs, pagination } = await listMyRfqs(user.id, {
    page: 1,
    limit: 20,
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <RfqList initialRfqs={rfqs} initialPagination={pagination} />
      </div>
    </AppShell>
  );
}

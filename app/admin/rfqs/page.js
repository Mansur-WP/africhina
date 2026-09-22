import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import AdminRfqList from '@/components/admin/AdminRfqList.jsx';
import { listAllRfqsAdmin } from '@/src/application/rfqs/rfqService.js';

export const metadata = {
  title: 'RFQ Management — Admin',
};

/**
 * SCR-038 — Manage RFQs (Admin)
 *
 * Page allowing administrators to view and process all incoming customer RFQs.
 */
export default async function AdminRfqsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'admin') redirect('/403');

  const { rfqs, pagination } = await listAllRfqsAdmin({ page: 1, limit: 20 });

  return (
    <AppShell>
      <div suppressHydrationWarning className="mx-auto max-w-5xl px-4 py-8">
        <AdminRfqList initialRfqs={rfqs} initialPagination={pagination} />
      </div>
    </AppShell>
  );
}

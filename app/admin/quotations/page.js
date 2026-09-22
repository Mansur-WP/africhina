import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell.jsx';
import AdminQuotationList from '@/components/admin/AdminQuotationList.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { listAdminQuotations } from '@/src/application/rfqs/quotationService.js';

export const metadata = { title: 'Quotation Management' };

export default async function AdminQuotationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'admin') redirect('/403');
  const { quotations } = await listAdminQuotations({ page: 1, limit: 20 });
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Quotation Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review drafts and finalized customer quotations.
          </p>
        </div>
        <AdminQuotationList quotations={quotations} />
      </div>
    </AppShell>
  );
}

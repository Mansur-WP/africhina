import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import EmptyState from '@/components/EmptyState.jsx';

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-semibold">My Orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your orders will appear here.
        </p>

        <div className="mt-6">
          <EmptyState
            title="Orders coming soon"
            description="Order creation and tracking will be added in a later milestone."
            action={
              <a href="/support" className="text-primary underline">
                Contact support
              </a>
            }
          />
        </div>
      </div>
    </AppShell>
  );
}

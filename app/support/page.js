import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  if (user.role?.code !== 'support') {
    redirect('/403');
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl rounded-3xl border bg-card p-10 shadow-card">
        <h1 className="text-3xl font-semibold">Support dashboard</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This area is reserved for support staff.
        </p>
      </div>
    </AppShell>
  );
}

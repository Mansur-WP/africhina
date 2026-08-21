import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import LogoutButton from '@/components/auth/LogoutButton.jsx';

export default async function LogisticsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  if (user.role?.code !== 'logistics') {
    redirect('/403');
  }

  return (
    <main className="bg-background-subtle min-h-screen px-6 py-24">
      <div className="mx-auto max-w-4xl rounded-3xl border bg-card p-10 shadow-card">
        <div className="mb-8 flex justify-end">
          <LogoutButton />
        </div>
        <h1 className="text-3xl font-semibold">Logistics dashboard</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This area is reserved for logistics officers.
        </p>
      </div>
    </main>
  );
}

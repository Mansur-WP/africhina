import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import NotificationsList from '@/components/NotificationsList.jsx';

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your in-app notifications.
        </p>

        <div className="mt-6">
          <NotificationsList />
        </div>
      </div>
    </AppShell>
  );
}

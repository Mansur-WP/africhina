import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import NotificationsList from '@/components/NotificationsList.jsx';

export const metadata = {
  title: 'Notifications — Africhina Connect',
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay updated on your sourcing requests, orders, payments, and
            shipment milestones.
          </p>
        </div>

        <div className="mt-6">
          <NotificationsList />
        </div>
      </div>
    </AppShell>
  );
}

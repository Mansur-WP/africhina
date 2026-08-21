import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import ProfileForm from '@/components/auth/ProfileForm.jsx';
import AppShell from '@/components/AppShell.jsx';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  if (!['buyer', 'admin', 'logistics', 'support'].includes(user.role?.code)) {
    redirect('/403');
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <ProfileForm initialUser={user} />
      </div>
    </AppShell>
  );
}

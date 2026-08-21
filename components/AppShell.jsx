import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';

export default async function AppShell({ children }) {
  const user = await getCurrentUser();

  return (
    <div suppressHydrationWarning className="bg-background-subtle min-h-screen">
      <AppHeader user={user} />
      <div
        suppressHydrationWarning
        className="mx-auto flex max-w-7xl gap-6 px-4 py-6"
      >
        <Sidebar user={user} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

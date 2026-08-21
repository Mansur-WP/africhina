import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { roleHomePage } from '@/src/shared/lib/roleRoutes.js';
import LoginForm from '@/components/auth/LoginForm.jsx';

export default async function LoginPage({ searchParams }) {
  const user = await getCurrentUser();
  if (user) {
    redirect(roleHomePage[user.role?.code] || '/dashboard');
  }

  const resolvedSearchParams = await searchParams;
  const redirectTo =
    typeof resolvedSearchParams?.redirectTo === 'string'
      ? resolvedSearchParams.redirectTo
      : '';

  return (
    <main className="bg-background-subtle flex min-h-screen items-center justify-center px-6 py-24">
      <LoginForm redirectTo={redirectTo} />
    </main>
  );
}

import ResetPasswordForm from '@/components/auth/ResetPasswordForm.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { redirect } from 'next/navigation';
import { roleHomePage } from '@/src/shared/lib/roleRoutes.js';

export default async function ResetPasswordPage({ searchParams }) {
  const user = await getCurrentUser();
  if (user) {
    redirect(roleHomePage[user.role?.code] || '/dashboard');
  }

  const resolvedSearchParams = await searchParams;
  const token =
    typeof resolvedSearchParams?.token === 'string'
      ? resolvedSearchParams.token
      : '';
  return (
    <main className="bg-background-subtle flex min-h-screen items-center justify-center px-6 py-24">
      <div className="w-full max-w-xl">
        <ResetPasswordForm token={token} />
      </div>
    </main>
  );
}

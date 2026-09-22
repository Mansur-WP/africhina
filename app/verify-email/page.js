import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { verifyEmail } from '@/src/application/auth/authService.js';
import { roleHomePage } from '@/src/shared/lib/roleRoutes.js';

export default async function VerifyEmailPage({ searchParams }) {
  const user = await getCurrentUser();
  const resolvedSearchParams = await searchParams;
  const token =
    typeof resolvedSearchParams?.token === 'string'
      ? resolvedSearchParams.token
      : '';
  let message = 'Please verify your email using the link sent to your inbox.';
  let variant = 'text-muted-foreground';

  if (token) {
    try {
      await verifyEmail(token);
      message = 'Your email has been verified. You may now log in.';
      variant = 'text-green-700';
    } catch (error) {
      message =
        error?.message ||
        'Unable to verify your email. The token may be invalid or expired.';
      variant = 'text-red-700';
    }
  } else if (user) {
    redirect(roleHomePage[user.role?.code] || '/dashboard');
  }

  return (
    <main className="bg-background-subtle flex min-h-screen items-center justify-center px-6 py-24">
      <div className="w-full max-w-xl rounded-3xl border bg-card p-8 shadow-card">
        <h1 className="text-2xl font-semibold">Verify your email</h1>
        <p className={`mt-4 text-sm ${variant}`}>{message}</p>
        <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
          <a href="/login" className="text-primary hover:underline">
            Back to login
          </a>
          <a href="/register" className="text-primary hover:underline">
            Create account
          </a>
        </div>
      </div>
    </main>
  );
}

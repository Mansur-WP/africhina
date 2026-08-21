import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { roleHomePage } from '@/src/shared/lib/roleRoutes.js';
import RegisterForm from '@/components/auth/RegisterForm.jsx';

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(roleHomePage[user.role?.code] || '/dashboard');
  }

  return (
    <main className="bg-background-subtle flex min-h-screen items-center justify-center px-6 py-24">
      <RegisterForm />
    </main>
  );
}

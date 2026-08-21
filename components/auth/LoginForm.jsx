'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { roleHomePage } from '@/src/shared/lib/roleRoutes.js';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/landing/Logo.jsx';

export default function LoginForm({ redirectTo = '' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    setIsLoading(false);
    const payload = await response.json();

    if (!response.ok) {
      setError(payload?.error?.message || 'Unable to login');
      return;
    }

    const role = payload.data?.user?.role?.code || 'buyer';
    const safeRedirectTo =
      redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : '';
    const destination = safeRedirectTo || roleHomePage[role] || '/dashboard';
    router.push(destination);
  }

  return (
    <div className="w-full max-w-md">
      <Link
        href="/"
        className="bg-surface-base animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold tracking-wider text-foreground uppercase shadow-sm transition hover:bg-muted"
      >
        <ArrowLeft size={14} className="text-[#CFA13C]" />
        Back to Homepage
      </Link>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border bg-card p-8 shadow-card"
      >
        <div className="flex flex-col items-center border-b border-border pb-4 text-center">
          <Logo size={50} showText={false} />
          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-foreground">
            Sign In to Africhina Connect
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Your trusted trade and education partner
          </p>
        </div>
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-foreground">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-xl border px-4 py-3 text-sm transition outline-none focus:border-[#CFA13C]"
          />
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-foreground">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-xl border px-4 py-3 text-sm transition outline-none focus:border-[#CFA13C]"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <a
            href="/forgot-password"
            className="font-semibold text-primary hover:underline"
          >
            Forgot password?
          </a>
          <a
            href="/register"
            className="font-semibold text-[#CFA13C] hover:underline"
          >
            Create account
          </a>
        </div>
      </form>
    </div>
  );
}

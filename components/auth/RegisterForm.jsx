'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/landing/Logo.jsx';

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const response = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password, role: 'buyer' }),
    });
    const payload = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(payload?.error?.message || 'Unable to register');
      return;
    }

    setSuccess('Account created successfully. Signing you in…');

    const loginResponse = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.ok) {
      setError(
        'Account created successfully, but sign-in failed. Please try again.',
      );
      return;
    }

    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    router.push('/dashboard');
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
            Create Your Account
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Join Africhina Connect trade &amp; education platform
          </p>
        </div>
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </p>
        ) : null}
        <div className="grid gap-4">
          <label className="space-y-2 text-sm">
            <span className="font-semibold text-foreground">Full name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-xl border px-4 py-3 text-sm transition outline-none focus:border-[#CFA13C]"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-semibold text-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border px-4 py-3 text-sm transition outline-none focus:border-[#CFA13C]"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-semibold text-foreground">Phone number</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              className="w-full rounded-xl border px-4 py-3 text-sm transition outline-none focus:border-[#CFA13C]"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-semibold text-foreground">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border px-4 py-3 text-sm transition outline-none focus:border-[#CFA13C]"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-semibold text-foreground">
              Confirm password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border px-4 py-3 text-sm transition outline-none focus:border-[#CFA13C]"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <a
            href="/login"
            className="font-semibold text-[#CFA13C] hover:underline"
          >
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}

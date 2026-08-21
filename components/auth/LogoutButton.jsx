'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    setIsLoading(true);
    setError('');

    const response = await fetch('/api/v1/auth/logout', {
      method: 'POST',
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = await response.json();
      setError(payload?.error?.message || 'Unable to log out');
      return;
    }

    router.push('/login');
  }

  return (
    <div className="flex flex-col items-end gap-3">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
      >
        {isLoading ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}

'use client';

import { useState } from 'react';

export default function ProfileForm({ initialUser }) {
  const [name, setName] = useState(initialUser?.name || '');
  const [phone, setPhone] = useState(initialUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(initialUser?.avatarUrl || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, avatarUrl }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error?.message || 'Unable to update profile');
        return;
      }
      setMessage('Profile updated successfully');
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border bg-card p-8 shadow-card"
    >
      <div>
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Update your personal details and contact information.
        </p>
      </div>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </p>
      ) : null}
      <div className="grid gap-4">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">Full name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="w-full rounded-xl border px-4 py-3 text-sm transition outline-none focus:border-primary"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-xl border px-4 py-3 text-sm transition outline-none focus:border-primary"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">Avatar URL</span>
          <input
            type="url"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            className="w-full rounded-xl border px-4 py-3 text-sm transition outline-none focus:border-primary"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}

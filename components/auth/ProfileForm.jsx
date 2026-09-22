'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
} from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function ProfileForm({ initialUser }) {
  const [name, setName] = useState(initialUser?.name || '');
  const [phone, setPhone] = useState(initialUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(initialUser?.avatarUrl || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isModified =
    name !== (initialUser?.name || '') ||
    phone !== (initialUser?.phone || '') ||
    avatarUrl !== (initialUser?.avatarUrl || '');

  function handleReset() {
    setName(initialUser?.name || '');
    setPhone(initialUser?.phone || '');
    setAvatarUrl(initialUser?.avatarUrl || '');
    setError('');
    setMessage('');
  }

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
      setMessage('Your profile has been updated successfully.');
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information, contact details, and account
          preferences.
        </p>
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Email & Verification */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <Mail size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              Email Address
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
              {initialUser?.email || '—'}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              {initialUser?.emailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                  <CheckCircle2 size={11} />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  Pending Verification
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Account Role & Status */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-muted-foreground"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              Account Type
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground capitalize">
              {initialUser?.role?.name || initialUser?.role?.code || 'Customer'}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                Active Account
              </span>
            </div>
          </div>
        </div>

        {/* Member Since */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 sm:col-span-2">
          <Calendar
            size={18}
            className="mt-0.5 shrink-0 text-muted-foreground"
          />
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Member Since
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {formatDate(initialUser?.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="border-b border-border pb-4">
          <h2 className="text-base font-semibold text-foreground">
            Personal & Contact Information
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Keep your contact details up to date for order notifications and
            delivery communication.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="grid gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-foreground"
              htmlFor="profile-name"
            >
              Full Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute top-3 left-3.5 text-muted-foreground"
              />
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={100}
                placeholder="e.g. Aliko Dangote"
                className="w-full rounded-lg border border-border bg-background py-2.5 pr-4 pl-10 text-sm transition outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-foreground"
              htmlFor="profile-phone"
            >
              Phone Number
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="absolute top-3 left-3.5 text-muted-foreground"
              />
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={30}
                placeholder="e.g. +234 801 234 5678"
                className="w-full rounded-lg border border-border bg-background py-2.5 pr-4 pl-10 text-sm transition outline-none focus:border-primary"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Used for logistics dispatch calls and WhatsApp delivery
              coordination.
            </p>
          </div>

          {/* Avatar URL */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-foreground"
              htmlFor="profile-avatar"
            >
              Avatar Image URL{' '}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <input
              id="profile-avatar"
              type="url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
          {isModified && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Save size={15} />
            {isLoading ? 'Saving Changes…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

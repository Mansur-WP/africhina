'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/v1/notifications');
        if (!res.ok) {
          throw new Error('Unable to load notifications');
        }
        const payload = await res.json();
        const items = payload?.data || payload?.notifications || [];
        const unread = items.filter((n) => !n.read).length;
        if (mounted) setCount(unread);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div suppressHydrationWarning className="relative">
      <Link href="/notifications" className="inline-flex items-center p-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="text-text-secondary h-5 w-5"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {loading ? null : count > 0 ? (
          <span className="bg-error ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium text-white">
            {count}
          </span>
        ) : null}
      </Link>
      {error ? (
        <div className="absolute right-0 mt-10 w-64 rounded-md border bg-red-50 p-3 text-sm text-red-700">
          Notification service unavailable
        </div>
      ) : null}
    </div>
  );
}

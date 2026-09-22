'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/v1/notifications/unread-count');
        if (res.ok) {
          const payload = await res.json();
          const unread = payload?.data?.unreadCount ?? 0;
          if (mounted) setCount(unread);
        }
      } catch {
        // Silently fail if notification service is momentarily unavailable
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
      <Link
        href="/notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        aria-label={
          count > 0 ? `Notifications (${count} unread)` : 'Notifications'
        }
        title="Notifications"
      >
        <Bell size={17} />
        {!loading && count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-xs">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </div>
  );
}

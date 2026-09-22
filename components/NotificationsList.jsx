'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  Package,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

const TYPE_META = {
  order: {
    label: 'Order',
    Icon: Package,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  payment: {
    label: 'Payment',
    Icon: CreditCard,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  shipping: {
    label: 'Shipping',
    Icon: Truck,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  system: {
    label: 'System',
    Icon: Bell,
    color: 'text-gray-600 bg-gray-50 border-gray-200',
  },
};

function formatDate(dateStr) {
  try {
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function NotificationsList() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingId, setMarkingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/v1/notifications');
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(
            payload?.error?.message || 'Failed to load notifications',
          );
        }
        const data = await res.json();
        const list = data?.data || data?.notifications || [];
        if (mounted) setItems(list);
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

  async function handleMarkRead(id) {
    setMarkingId(id);
    try {
      const response = await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error('Unable to mark notification as read.');
      }
      setItems((cur) =>
        cur.map((x) => (x.id === id ? { ...x, read: true } : x)),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setMarkingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl border border-border bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Unable to load notifications</p>
          <p className="mt-0.5 text-xs text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Bell size={22} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            No notifications yet
          </p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            You are all caught up! You will receive updates here when payments
            are confirmed or orders are dispatched.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((n) => {
        const typeMeta = TYPE_META[n.type] || TYPE_META.system;
        const { label, Icon, color } = typeMeta;
        const isUnread = !n.read;

        return (
          <li
            key={n.id}
            className={`flex items-start justify-between gap-4 rounded-xl border p-4 transition ${
              isUnread
                ? 'border-primary/30 bg-primary/5 shadow-xs'
                : 'border-border bg-card opacity-80'
            }`}
          >
            <div className="flex min-w-0 items-start gap-3.5">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold ${color}`}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    {label}
                  </span>
                  {isUnread && (
                    <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {n.title || 'Notification'}
                </p>
                {n.body && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {n.body}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock size={11} />
                  <span>{formatDate(n.createdAt)}</span>
                </div>
              </div>
            </div>

            {isUnread && (
              <button
                disabled={markingId === n.id}
                onClick={() => handleMarkRead(n.id)}
                className="shrink-0 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                {markingId === n.id ? 'Marking…' : 'Mark as read'}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

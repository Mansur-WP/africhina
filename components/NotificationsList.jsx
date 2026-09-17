'use client';

import { useEffect, useState } from 'react';

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
    return () => (mounted = false);
  }, []);

  if (loading)
    return (
      <p className="text-sm text-muted-foreground">Loading notifications…</p>
    );
  if (error)
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-red-700">
        Error loading notifications: {error}
      </div>
    );
  if (!items || items.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        You have no notifications.
      </p>
    );

  return (
    <ul className="space-y-3">
      {items.map((n) => (
        <li
          key={n.id}
          className={`rounded-md border bg-white p-3 ${n.read ? 'opacity-70' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-text-primary text-sm font-medium">
                {n.title || 'Notification'}
              </p>
              {n.body ? (
                <p className="text-text-secondary mt-1 text-sm">{n.body}</p>
              ) : null}
            </div>
            <div className="ml-4 flex flex-col items-end gap-2">
              <small className="text-xs text-muted-foreground">
                {new Date(n.createdAt).toLocaleString()}
              </small>
              {!n.read ? (
                <button
                  disabled={markingId === n.id}
                  className="text-xs text-primary"
                  onClick={async () => {
                    setMarkingId(n.id);
                    try {
                      const response = await fetch(
                        `/api/v1/notifications/${n.id}/read`,
                        {
                          method: 'PUT',
                        },
                      );
                      if (!response.ok)
                        throw new Error('Unable to mark notification as read.');
                      setItems((cur) =>
                        cur.map((x) =>
                          x.id === n.id ? { ...x, read: true } : x,
                        ),
                      );
                    } catch (err) {
                      setError(err.message);
                    } finally {
                      setMarkingId(null);
                    }
                  }}
                >
                  {markingId === n.id ? 'Marking...' : 'Mark read'}
                </button>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

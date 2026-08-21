'use client';

import { useState } from 'react';
import Link from 'next/link';
import LogoutButton from './auth/LogoutButton';

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);

  return (
    <div suppressHydrationWarning className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="hover:bg-surface-muted inline-flex items-center gap-2 rounded-md px-2 py-1"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="bg-surface text-text-primary inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
          {user?.name
            ? user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
            : 'U'}
        </span>
        <span className="hidden truncate text-sm md:inline">
          {user?.name || user?.email}
        </span>
      </button>

      {open ? (
        <div className="shadow-dropdown absolute right-0 z-40 mt-2 w-52 rounded-md border bg-white p-3">
          <Link
            href="/profile"
            className="hover:bg-surface-muted block rounded-md px-2 py-2 text-sm"
          >
            Profile
          </Link>
          <Link
            href="/support"
            className="hover:bg-surface-muted mt-1 block rounded-md px-2 py-2 text-sm"
          >
            Support
          </Link>
          <div className="mt-3 border-t pt-3">
            <LogoutButton />
          </div>
        </div>
      ) : null}
    </div>
  );
}

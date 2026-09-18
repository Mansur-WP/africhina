'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Package, HelpCircle, ChevronDown } from 'lucide-react';
import LogoutButton from './auth/LogoutButton';

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div ref={menuRef} suppressHydrationWarning className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-2.5 transition hover:border-primary/40 focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {initials}
        </span>
        <span className="hidden max-w-[130px] truncate text-xs font-semibold text-foreground md:inline">
          {user?.name || user?.email?.split('@')[0]}
        </span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 animate-in rounded-xl border border-border bg-card p-2 shadow-lg zoom-in-95 fade-in">
          {/* User Header */}
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-xs font-bold text-foreground">
              {user?.name || 'Account'}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {user?.email}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-0.5 py-1.5">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              <User size={14} className="text-muted-foreground" />
              Profile
            </Link>
            <Link
              href="/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              <Package size={14} className="text-muted-foreground" />
              Orders
            </Link>
            <Link
              href="/support"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              <HelpCircle size={14} className="text-muted-foreground" />
              Support
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-border pt-1.5">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';
import { Menu, X } from 'lucide-react';

export default function AppHeader({ user, showNotifications = true }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      suppressHydrationWarning
      className="sticky top-0 z-30 border-b border-border bg-background/90 px-6 py-3.5 backdrop-blur-md"
    >
      <div
        suppressHydrationWarning
        className="mx-auto flex max-w-7xl items-center justify-between gap-4"
      >
        {/* Left: Hamburger + Logo */}
        <div suppressHydrationWarning className="flex items-center gap-4">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex items-center rounded-full border border-border p-2 text-foreground hover:bg-muted md:hidden"
            aria-label="Open menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Link
            href={user?.role?.code === 'admin' ? '/admin' : '/dashboard'}
            className="inline-flex items-center gap-2.5"
          >
            <div
              suppressHydrationWarning
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-xs font-bold text-white"
            >
              AC
            </div>
            <span className="hidden text-sm font-extrabold tracking-tight text-foreground uppercase md:inline">
              Africhina Connect
            </span>
          </Link>
        </div>

        {/* Center: Quick Nav Links */}
        <div suppressHydrationWarning className="flex items-center gap-6">
          <nav suppressHydrationWarning className="hidden gap-6 md:flex">
            {user?.role?.code === 'admin' ? (
              <>
                <Link
                  href="/admin"
                  className="text-xs font-semibold tracking-wider text-foreground uppercase transition hover:text-foreground/80"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/rfqs"
                  className="text-xs font-semibold tracking-wider text-muted-foreground uppercase transition hover:text-foreground"
                >
                  Manage RFQs
                </Link>
                <Link
                  href="/admin/quotations"
                  className="text-xs font-semibold tracking-wider text-muted-foreground uppercase transition hover:text-foreground"
                >
                  Quotations
                </Link>
                <Link
                  href="/admin/orders"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted"
                >
                  Orders
                </Link>
                <Link
                  href="/admin/orders"
                  className="text-xs font-semibold tracking-wider text-muted-foreground uppercase transition hover:text-foreground"
                >
                  Orders
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="text-xs font-semibold tracking-wider text-foreground uppercase transition hover:text-foreground/80"
                >
                  Dashboard
                </Link>
                <Link
                  href="/catalogue"
                  className="text-xs font-semibold tracking-wider text-muted-foreground uppercase transition hover:text-foreground"
                >
                  Products
                </Link>
                <Link
                  href="/cart"
                  className="text-xs font-semibold tracking-wider text-muted-foreground uppercase transition hover:text-foreground"
                >
                  Cart
                </Link>
                <Link
                  href="/orders"
                  className="text-xs font-semibold tracking-wider text-muted-foreground uppercase transition hover:text-foreground"
                >
                  Orders
                </Link>
                <Link
                  href="/rfq"
                  className="text-xs font-semibold tracking-wider text-muted-foreground uppercase transition hover:text-foreground"
                >
                  RFQs
                </Link>
                <Link
                  href="/quotations"
                  className="text-xs font-semibold tracking-wider text-muted-foreground uppercase transition hover:text-foreground"
                >
                  Quotations
                </Link>
              </>
            )}
          </nav>

          <div suppressHydrationWarning className="flex items-center gap-3">
            {showNotifications ? <NotificationBell /> : null}
            <UserMenu user={user} />
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen ? (
        <div className="mt-3 border-t border-border pt-3 md:hidden">
          <nav className="flex flex-col gap-1.5">
            {user?.role?.code === 'admin' ? (
              <>
                <Link
                  href="/admin"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-wider text-foreground uppercase hover:bg-muted"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/rfqs"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted"
                >
                  Manage RFQs
                </Link>
                <Link
                  href="/admin/quotations"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted"
                >
                  Quotations
                </Link>
                <Link
                  href="/profile"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-wider text-foreground uppercase hover:bg-muted"
                >
                  Dashboard
                </Link>
                <Link
                  href="/catalogue"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted"
                >
                  Products
                </Link>
                <Link
                  href="/cart"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted"
                >
                  Cart
                </Link>
                <Link
                  href="/orders"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted"
                >
                  Orders
                </Link>
                <Link
                  href="/rfq"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted"
                >
                  RFQs
                </Link>
                <Link
                  href="/quotations"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted"
                >
                  Quotations
                </Link>
                <Link
                  href="/support"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted"
                >
                  Support
                </Link>
                <Link
                  href="/profile"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted"
                >
                  Profile
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

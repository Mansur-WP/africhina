'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';
import { Menu, X } from 'lucide-react';

function isLinkActive(pathname, href) {
  if (href === '/dashboard' || href === '/admin') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(href + '/');
}

export default function AppHeader({ user, showNotifications = true }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isAdmin = user?.role?.code === 'admin';

  const buyerNavLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/orders', label: 'Orders' },
    { href: '/cart', label: 'Cart' },
    { href: '/rfq', label: 'Requests' },
    { href: '/support', label: 'Support' },
  ];

  const adminNavLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/rfqs', label: 'Manage RFQs' },
    { href: '/admin/quotations', label: 'Quotations' },
  ];

  const links = isAdmin ? adminNavLinks : buyerNavLinks;

  return (
    <header
      suppressHydrationWarning
      className="sticky top-0 z-30 border-b border-border bg-background/90 px-6 py-3 backdrop-blur-md"
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
            aria-label="Open navigation menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Link
            href={isAdmin ? '/admin' : '/dashboard'}
            className="inline-flex items-center gap-2.5"
          >
            <div
              suppressHydrationWarning
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-xs font-bold text-white shadow-xs"
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
            {links.map((link) => {
              const active = isLinkActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-semibold tracking-wider uppercase transition ${
                    active
                      ? 'font-bold text-foreground underline decoration-primary decoration-2 underline-offset-8'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div suppressHydrationWarning className="flex items-center gap-3">
            {showNotifications ? <NotificationBell /> : null}
            <UserMenu user={user} />
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="mt-3 animate-in border-t border-border pt-3 fade-in md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const active = isLinkActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-xs font-semibold tracking-wider uppercase transition ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className={`block rounded-lg px-3 py-2 text-xs font-semibold tracking-wider uppercase transition ${
                pathname === '/profile'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Profile
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

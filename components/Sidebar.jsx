'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ user }) {
  const pathname = usePathname();

  const isAdmin = user?.role?.code === 'admin';

  const buyerLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/orders', label: 'Orders' },
    { href: '/cart', label: 'Cart' },
    { href: '/rfq', label: 'Requests' },
    { href: '/support', label: 'Support' },
    { href: '/profile', label: 'Profile' },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/rfqs', label: 'Manage RFQs' },
    { href: '/admin/quotations', label: 'Quotations' },
    { href: '/profile', label: 'Profile' },
  ];

  const links = isAdmin ? adminLinks : buyerLinks;

  return (
    <aside
      suppressHydrationWarning
      className="hidden w-56 shrink-0 border-r border-border bg-background md:flex md:flex-col"
    >
      <div
        suppressHydrationWarning
        className="flex flex-1 flex-col gap-1 px-3 py-6"
      >
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-md px-3 py-2 text-sm transition ${
                active
                  ? 'bg-foreground font-semibold text-background'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>

      <div
        suppressHydrationWarning
        className="border-t border-border px-4 py-4"
      >
        <span className="text-xs text-muted-foreground">v0.1.0</span>
      </div>
    </aside>
  );
}

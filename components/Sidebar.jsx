'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ShoppingBag,
  HelpCircle,
  User,
} from 'lucide-react';

function isLinkActive(pathname, href) {
  if (href === '/dashboard' || href === '/admin') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(href + '/');
}

export default function Sidebar({ user }) {
  const pathname = usePathname();

  const isAdmin = user?.role?.code === 'admin';

  const buyerLinks = [
    { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/catalogue', label: 'Catalogue', Icon: ShoppingBag },
    { href: '/orders', label: 'Orders', Icon: Package },
    { href: '/cart', label: 'Cart', Icon: ShoppingCart },
    { href: '/support', label: 'Support', Icon: HelpCircle },
    { href: '/profile', label: 'Profile', Icon: User },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', Icon: ShoppingBag },
    { href: '/admin/orders', label: 'Orders', Icon: Package },
    { href: '/catalogue', label: 'View Catalogue', Icon: ShoppingBag },
    { href: '/profile', label: 'Profile', Icon: User },
  ];

  const links = isAdmin ? adminLinks : buyerLinks;

  return (
    <aside
      suppressHydrationWarning
      className="hidden w-56 shrink-0 border-r border-border bg-card/40 md:flex md:flex-col"
    >
      <div
        suppressHydrationWarning
        className="flex flex-1 flex-col gap-1 px-3 py-6"
      >
        {links.map((l) => {
          const active = isLinkActive(pathname, l.href);
          const Icon = l.Icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                active
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon size={16} />
              <span>{l.label}</span>
            </Link>
          );
        })}
      </div>

      <div
        suppressHydrationWarning
        className="border-t border-border px-4 py-4"
      >
        <span className="text-[11px] font-medium text-muted-foreground">
          Africhina Connect V2
        </span>
      </div>
    </aside>
  );
}

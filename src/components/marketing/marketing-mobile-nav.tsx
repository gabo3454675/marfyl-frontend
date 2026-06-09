'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, CreditCard, Home, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/empresa', label: 'Inicio', icon: Home, match: (p: string) => p === '/empresa' },
  {
    href: '/caracteristicas',
    label: 'Producto',
    icon: Sparkles,
    match: (p: string) => p.startsWith('/caracteristicas'),
  },
  {
    href: '/precios',
    label: 'Precios',
    icon: CreditCard,
    match: (p: string) => p.startsWith('/precios'),
  },
  {
    href: '/blog',
    label: 'Blog',
    icon: BookOpen,
    match: (p: string) => p.startsWith('/blog'),
  },
] as const;

export function MarketingMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="marketing-mobile-nav md:hidden"
      aria-label="Navegación principal"
    >
      <div className="marketing-mobile-nav__inner">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn('marketing-mobile-nav__item', active && 'marketing-mobile-nav__item--active')}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

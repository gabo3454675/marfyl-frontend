'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AppNavItem } from '@/config/app-nav';
import { FISCAL_NAV_GROUP, FISCAL_NAV_ITEMS } from '@/config/fiscal-nav';
import { isFiscalRoute, resolveFiscalNavId } from '@/config/fiscal-nav';

export function NavSectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/55 select-none',
        className,
      )}
    >
      {children}
    </p>
  );
}

export function NavSection({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('nav-sidebar-section', className)} aria-label={label}>
      <NavSectionLabel>{label}</NavSectionLabel>
      <div className="flex flex-col gap-0.5 mt-0.5">{children}</div>
    </section>
  );
}

export function SidebarNavLink({
  item,
  active,
  compact,
}: {
  item: AppNavItem;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Button
      asChild
      variant={active ? 'default' : 'ghost'}
      size={compact ? 'sm' : 'default'}
      className={cn(
        'w-full justify-start gap-3 h-10 font-normal',
        active
          ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary'
          : 'text-sidebar-foreground hover:bg-sidebar-accent',
      )}
    >
      <Link href={item.href} prefetch>
        <item.icon className={cn('shrink-0', compact ? 'h-4 w-4' : 'h-5 w-5')} />
        <span className="truncate text-sm">{item.label}</span>
      </Link>
    </Button>
  );
}

export function FiscalNavCollapsible({
  pathname,
  fiscalOpen,
  onToggle,
}: {
  pathname: string;
  fiscalOpen: boolean;
  onToggle: () => void;
}) {
  const fiscalActive = isFiscalRoute(pathname);

  return (
    <section className="nav-sidebar-section nav-fiscal-block" aria-label={FISCAL_NAV_GROUP.label}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={fiscalOpen}
        className={cn(
          'nav-fiscal-toggle w-full flex items-center justify-between gap-2 rounded-lg px-2 py-2.5 min-h-[40px]',
          'text-left transition-colors hover:bg-sidebar-accent/80',
          fiscalActive && 'bg-sidebar-accent/50 text-fiscal-accent',
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          <FISCAL_NAV_GROUP.icon className="h-4 w-4 shrink-0 text-fiscal-accent" />
          <span className="text-[11px] font-semibold uppercase tracking-wide truncate">
            {FISCAL_NAV_GROUP.label}
          </span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-sidebar-foreground/50 transition-transform duration-200', fiscalOpen && 'rotate-180')}
        />
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out',
          fiscalOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 mt-0',
        )}
      >
        <div className="overflow-hidden min-h-0">
          <div className="flex flex-col gap-0.5 pl-2 ml-1 border-l border-fiscal-accent/25 py-1">
            {FISCAL_NAV_ITEMS.map((item) => {
              const fiscalItemActive = resolveFiscalNavId(pathname) === item.id;
              return (
                <Button
                  key={item.id}
                  asChild
                  variant={fiscalItemActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'w-full justify-start gap-2.5 h-9 font-normal',
                    fiscalItemActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent',
                  )}
                >
                  <Link href={item.href} prefetch>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate text-sm">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

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
        'px-2 py-1.5 text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/55 select-none opacity-70',
        className,
      )}
    >
      {children}
    </p>
  );
}

/** @deprecated Usar NavSectionCollapsible */
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

export function NavSectionCollapsible({
  id,
  label,
  open,
  onToggle,
  hasActiveChild,
  children,
  variant = 'sidebar',
}: {
  id: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  hasActiveChild?: boolean;
  children: React.ReactNode;
  variant?: 'sidebar' | 'sheet';
}) {
  const isSheet = variant === 'sheet';

  return (
    <section
      className={cn(
        isSheet ? 'border-b border-border/60 last:border-b-0' : 'nav-sidebar-section',
      )}
      aria-label={label}
    >
      <button
        type="button"
        id={`nav-section-${id}`}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`nav-section-panel-${id}`}
        className={cn(
          'w-full flex items-center justify-between gap-2 rounded-lg cursor-pointer transition-colors duration-200 touch-manipulation',
          isSheet
            ? 'min-h-[48px] px-1 py-3 text-left hover:bg-muted/50'
            : 'min-h-[40px] px-2 py-2.5 text-left hover:bg-sidebar-accent/80',
          hasActiveChild && !isSheet && 'bg-sidebar-accent/40',
        )}
      >
        <span
          className={cn(
            'font-semibold uppercase tracking-wide truncate',
            isSheet ? 'text-[11px] text-muted-foreground' : 'text-[11px] text-sidebar-foreground/70',
          )}
        >
          {label}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-200',
            isSheet ? 'text-muted-foreground' : 'text-sidebar-foreground/50',
            open && 'rotate-180',
          )}
        />
      </button>

      <div
        id={`nav-section-panel-${id}`}
        role="region"
        aria-labelledby={`nav-section-${id}`}
        className={cn(
          'grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out',
          open ? 'grid-rows-[1fr] opacity-100 mt-0.5' : 'grid-rows-[0fr] opacity-0 mt-0',
        )}
      >
        <div className="overflow-hidden min-h-0">
          <div
            className={cn(
              'flex flex-col gap-0.5',
              isSheet ? 'pb-2 pl-1' : 'pl-2 ml-1 border-l border-sidebar-border/50 py-1',
            )}
          >
            {children}
          </div>
        </div>
      </div>
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
      variant="ghost"
      size={compact ? 'sm' : 'default'}
      data-active={active ? 'true' : 'false'}
      className={cn('admin-nav-link', compact && 'h-9 gap-2')}
    >
      <Link href={item.href} prefetch className="cursor-pointer">
        <item.icon className={cn('shrink-0', compact ? 'h-4 w-4' : 'h-[1.125rem] w-[1.125rem]')} />
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
                  variant="ghost"
                  size="sm"
                  data-active={fiscalItemActive ? 'true' : 'false'}
                  className="admin-nav-link h-9 gap-2.5"
                >
                  <Link href={item.href} prefetch className="cursor-pointer">
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

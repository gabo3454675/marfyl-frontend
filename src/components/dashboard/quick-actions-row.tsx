'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  FileText,
  Landmark,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UsePermissionReturn } from '@/hooks/usePermission';

type QuickAction = {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  show: boolean;
  primary?: boolean;
};

interface QuickActionsRowProps {
  permissions: UsePermissionReturn;
  className?: string;
}

export function QuickActionsRow({ permissions, className }: QuickActionsRowProps) {
  const actions: QuickAction[] = [
    {
      id: 'pos',
      label: 'Abrir POS',
      shortLabel: 'POS',
      href: '/pos',
      icon: ShoppingCart,
      show: permissions.canAccessPOS || permissions.canManageInvoices,
      primary: true,
    },
    {
      id: 'invoices',
      label: 'Facturas',
      shortLabel: 'Facturas',
      href: '/invoices',
      icon: FileText,
      show: permissions.canManageInvoices,
    },
    {
      id: 'stock',
      label: 'Alertas stock',
      shortLabel: 'Stock',
      href: '/alertas-stock',
      icon: AlertTriangle,
      show: permissions.canManageInventory || permissions.canManageProducts,
    },
    {
      id: 'fiscal',
      label: 'Fiscal',
      shortLabel: 'Fiscal',
      href: '/fiscal',
      icon: Landmark,
      show: permissions.canManageFiscal,
    },
  ].filter((a) => a.show);

  if (actions.length === 0) return null;

  return (
    <section aria-label="Acciones rápidas" className={cn('space-y-2.5', className)}>
      <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Acciones rápidas
      </p>
      <div
        className={cn(
          'grid gap-2.5',
          actions.length === 1 && 'grid-cols-1',
          actions.length === 2 && 'grid-cols-2',
          actions.length === 3 && 'grid-cols-3 max-[360px]:grid-cols-1',
          actions.length >= 4 && 'grid-cols-2 sm:grid-cols-4',
        )}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              href={action.href}
              className={cn(
                'group inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-2xl',
                'px-3 py-2.5 sm:px-3.5 text-sm font-medium',
                'transition-all duration-200 touch-manipulation active:scale-[0.99]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                action.primary
                  ? cn(
                      'bg-primary text-primary-foreground border border-primary/80',
                      'shadow-[0_10px_28px_-12px_hsl(var(--primary)/0.7)]',
                      'hover:brightness-110',
                    )
                  : cn(
                      'border border-border/70 dark:border-white/[0.08] bg-card/60 text-foreground',
                      'hover:border-primary/35 hover:bg-primary/[0.08]',
                      'dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]',
                    ),
              )}
            >
              <span
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-xl shrink-0',
                  action.primary
                    ? 'bg-black/15 text-primary-foreground'
                    : 'bg-primary/10 text-primary ring-1 ring-primary/15',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="truncate">
                <span className="min-[400px]:hidden">{action.shortLabel}</span>
                <span className="hidden min-[400px]:inline">{action.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

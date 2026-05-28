'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FISCAL_MODULE_LABEL, FISCAL_NAV_ITEMS, resolveFiscalNavId } from '@/config/fiscal-nav';
import { usePermission } from '@/hooks/usePermission';
import { ChevronRight } from 'lucide-react';

export function FiscalShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeId = resolveFiscalNavId(pathname);
  const { canManageFiscal } = usePermission();
  const current = FISCAL_NAV_ITEMS.find((i) => i.id === activeId);

  if (!canManageFiscal) return null;

  return (
    <div className="w-full min-w-0">
        <nav
          className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground"
          aria-label="Ruta"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Inicio
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
          <Link href="/fiscal" className="hover:text-primary transition-colors font-medium text-primary">
            {FISCAL_MODULE_LABEL}
          </Link>
          {current && current.id !== 'fiscal' && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
              <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
                {current.label}
              </span>
            </>
          )}
        </nav>

        <div>
          <header className="mb-5 sm:mb-6 flex flex-col gap-3 sm:gap-4 border-b border-border/60 pb-4 sm:pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="fiscal-page-title break-words">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex flex-wrap items-center gap-2 shrink-0 sm:justify-end">
                {actions}
              </div>
            )}
          </header>

          <div className="fiscal-page-content w-full space-y-5 sm:space-y-6">{children}</div>
        </div>
    </div>
  );
}

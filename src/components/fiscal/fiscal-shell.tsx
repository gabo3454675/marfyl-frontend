'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FISCAL_MODULE_LABEL, FISCAL_NAV_ITEMS, resolveFiscalNavId } from '@/config/fiscal-nav';
import { usePermission } from '@/hooks/usePermission';
import { ChevronRight } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminMotionFade } from '@/components/admin/admin-motion';

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
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
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

        <AdminMotionFade>
          <AdminPageHeader
            eyebrow={FISCAL_MODULE_LABEL}
            title={<span className="fiscal-page-title break-words">{title}</span>}
            subtitle={subtitle}
            actions={actions}
            className="mb-5 sm:mb-6 border-b border-border/60 pb-4 sm:pb-5"
          />
          <div className="fiscal-page-content admin-page-body w-full">{children}</div>
        </AdminMotionFade>
    </div>
  );
}

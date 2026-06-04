'use client';

import { cn } from '@/lib/utils';

/** Barra de filtros alineada (año/mes, actualizar) en páginas fiscales. */
export function FiscalToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row flex-wrap items-end gap-3 rounded-lg border border-border/60 bg-muted/25 px-3 sm:px-4 py-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminPanel } from '@/components/admin/admin-panel';

/** KPI compacto para filas de métricas (gastos, resúmenes). */
export function AdminStatCard({
  title,
  value,
  hint,
  icon: Icon,
  className,
}: {
  title: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <AdminPanel elevation="sm" className={cn('admin-stat-card h-full', className)}>
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="admin-metric-value mt-1.5">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="admin-metric-icon shrink-0 !p-2">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
          </div>
        ) : null}
      </div>
    </AdminPanel>
  );
}

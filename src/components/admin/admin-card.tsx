'use client';

import { cn } from '@/lib/utils';
import { AdminPanel } from '@/components/admin/admin-panel';

export function AdminCard({
  title,
  description,
  headerActions,
  children,
  className,
  headerClassName,
  bodyClassName,
  zone = 'app',
  elevation = 'md',
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  headerActions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  zone?: 'app' | 'fiscal';
  elevation?: 'sm' | 'md' | 'lg';
}) {
  const hasHeader = title || description || headerActions;

  return (
    <AdminPanel zone={zone} elevation={elevation} className={cn('admin-card', className)}>
      {hasHeader ? (
        <div
          className={cn(
            'admin-card-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-border/50 px-4 py-4 sm:px-6 sm:py-5',
            headerClassName,
          )}
        >
          <div className="min-w-0 flex-1 space-y-1">
            {title ? (
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {headerActions ? (
            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
              {headerActions}
            </div>
          ) : null}
        </div>
      ) : null}
      {children !== undefined ? (
        <div className={cn('admin-card-body p-4 sm:p-6', bodyClassName)}>{children}</div>
      ) : null}
    </AdminPanel>
  );
}

/** Panel para gráficos y bloques analíticos con cabecera estándar. */
export function AdminChartCard({
  title,
  description,
  children,
  className,
  bodyClassName,
  zone = 'app',
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  zone?: 'app' | 'fiscal';
}) {
  return (
    <AdminCard
      zone={zone}
      title={title}
      description={description}
      className={className}
      bodyClassName={cn('pt-0 sm:pt-0', bodyClassName)}
    >
      {children}
    </AdminCard>
  );
}

/** Contenedor con scroll horizontal seguro para tablas (ui-ux-pro-max). */
export function AdminTableWrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('admin-table-wrap -mx-3 sm:-mx-1 overflow-x-auto overscroll-x-contain', className)}>
      {children}
    </div>
  );
}

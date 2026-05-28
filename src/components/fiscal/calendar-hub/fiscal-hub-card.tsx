'use client';

import { cn } from '@/lib/utils';

export function FiscalHubCard({
  className,
  children,
  noPadding,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
  noPadding?: boolean;
}) {
  return (
    <section
      className={cn(
        'fiscal-hub-card dm-fiscal-card rounded-2xl transition-colors duration-200',
        !noPadding && 'p-5 sm:p-6',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function FiscalHubSectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
      <div className="min-w-0">
        <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

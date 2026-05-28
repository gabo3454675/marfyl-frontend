'use client';

import { cn } from '@/lib/utils';

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid w-full auto-rows-[minmax(120px,auto)] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  className,
  children,
  colSpan = 1,
}: {
  className?: string;
  children: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4;
}) {
  const span =
    colSpan === 4
      ? 'md:col-span-4'
      : colSpan === 3
        ? 'md:col-span-3'
        : colSpan === 2
          ? 'md:col-span-2'
          : '';
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md dark:border-border/40 dark:bg-card/80',
        span,
        className,
      )}
    >
      {children}
    </div>
  );
}

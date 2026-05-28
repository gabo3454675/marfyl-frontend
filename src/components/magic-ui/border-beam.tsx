'use client';

import { cn } from '@/lib/utils';

/** Borde animado estilo Magic UI (CSS puro). */
export function BorderBeam({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <div
      className={cn(
        'relative rounded-2xl p-[1px] overflow-hidden bg-gradient-to-r from-transparent via-fiscal-accent/60 to-transparent animate-border-beam',
        containerClassName,
      )}
    >
      <div className={cn('relative rounded-2xl bg-card h-full', className)}>{children}</div>
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';

/** Card con borde degradado (estilo Magic UI). */
export function MagicCard({
  className,
  children,
  gradient = false,
}: {
  className?: string;
  children: React.ReactNode;
  gradient?: boolean;
}) {
  if (!gradient) {
    return (
      <div className={cn('rounded-2xl border bg-card p-5 shadow-sm', className)}>
        {children}
      </div>
    );
  }
  return (
    <div
      className={cn(
        'relative rounded-2xl p-[1px] bg-gradient-to-br from-emerald-500/40 via-transparent to-slate-900/30 dark:from-emerald-400/30 dark:to-slate-700/50',
        className,
      )}
    >
      <div className="rounded-2xl bg-card p-5 h-full dark:bg-slate-950/90">{children}</div>
    </div>
  );
}

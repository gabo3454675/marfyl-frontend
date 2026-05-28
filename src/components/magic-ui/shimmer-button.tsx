'use client';

import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

const baseStyles =
  'relative inline-flex items-center justify-center overflow-hidden rounded-lg px-4 py-2 text-sm font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

export function ShimmerButton({
  children,
  className,
  asChild,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const shimmer = (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent dark:via-slate-900/30"
    />
  );

  if (asChild) {
    return (
      <span className={cn('relative inline-flex overflow-hidden rounded-lg', className)}>
        {shimmer}
        <Slot className={cn(baseStyles, 'z-10')} {...props}>
          {children}
        </Slot>
      </span>
    );
  }

  return (
    <button type="button" className={cn(baseStyles, className)} {...props}>
      {shimmer}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

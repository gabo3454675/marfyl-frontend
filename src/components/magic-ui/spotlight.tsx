'use client';

import { cn } from '@/lib/utils';

export function Spotlight({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute -top-24 left-1/2 h-[320px] w-[min(720px,90vw)] -translate-x-1/2 rounded-full',
        'bg-[radial-gradient(ellipse_at_center,hsl(var(--fiscal-accent)/0.18),transparent_70%)]',
        'blur-3xl',
        className,
      )}
    />
  );
}

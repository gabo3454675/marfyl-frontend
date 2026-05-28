'use client';

import { cn } from '@/lib/utils';

export function DotPattern({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]',
        className,
      )}
      style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.25) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    />
  );
}

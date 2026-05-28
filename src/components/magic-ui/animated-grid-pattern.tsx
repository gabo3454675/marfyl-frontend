'use client';

import { cn } from '@/lib/utils';

/** Cuadrícula sutil animada (estilo Magic UI grid pattern). */
export function AnimatedGridPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]',
        'bg-[linear-gradient(to_right,hsl(var(--border)/0.5)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.5)_1px,transparent_1px)]',
        'bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]',
        'animate-grid-fade',
        className,
      )}
    />
  );
}

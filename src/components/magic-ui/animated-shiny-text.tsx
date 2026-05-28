'use client';

import { cn } from '@/lib/utils';

export function AnimatedShinyText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-block bg-gradient-to-r from-foreground via-fiscal-accent to-foreground bg-[length:200%_auto] bg-clip-text text-transparent animate-shine',
        className,
      )}
    >
      {children}
    </span>
  );
}

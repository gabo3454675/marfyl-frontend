'use client';

import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export function Meteors({ number = 12, className }: { number?: number; className?: string }) {
  const meteors = useMemo(
    () =>
      Array.from({ length: number }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 2}s`,
        duration: `${2 + Math.random() * 3}s`,
      })),
    [number],
  );

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {meteors.map((m) => (
        <span
          key={m.id}
          className="absolute top-0 h-0.5 w-0.5 rotate-[215deg] animate-meteor rounded-full shadow-[0_0_0_1px_hsl(var(--fiscal-accent)/0.3)]"
          style={{
            left: m.left,
            animationDelay: m.delay,
            animationDuration: m.duration,
            backgroundColor: 'hsl(var(--fiscal-accent))',
          }}
        >
          <span className="absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-gradient-to-r from-fiscal-accent to-transparent" />
        </span>
      ))}
    </div>
  );
}

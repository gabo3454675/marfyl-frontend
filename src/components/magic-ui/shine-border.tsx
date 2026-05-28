'use client';

import { cn } from '@/lib/utils';

export function ShineBorder({
  children,
  className,
  borderRadius = 16,
}: {
  children: React.ReactNode;
  className?: string;
  borderRadius?: number;
}) {
  return (
    <div className={cn('relative', className)} style={{ borderRadius }}>
      <div
        className="pointer-events-none absolute -inset-px animate-[spin_4s_linear_infinite] opacity-60"
        style={{
          borderRadius,
          background:
            'conic-gradient(from 0deg, transparent, hsl(var(--fiscal-accent) / 0.55), transparent)',
        }}
      />
      <div
        className="relative overflow-hidden bg-card"
        style={{ borderRadius: Math.max(0, borderRadius - 1) }}
      >
        {children}
      </div>
    </div>
  );
}

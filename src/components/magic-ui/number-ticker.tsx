'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function NumberTicker({
  value,
  className,
  prefix = '',
  suffix = '',
  decimals = 2,
}: {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = display;
    const end = value;
    if (start === end) return;
    const steps = 12;
    let frame = 0;
    const id = setInterval(() => {
      frame += 1;
      const t = frame / steps;
      setDisplay(start + (end - start) * Math.min(1, t));
      if (frame >= steps) clearInterval(id);
    }, 24);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const formatted = display.toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={cn('tabular-nums tracking-tight', className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

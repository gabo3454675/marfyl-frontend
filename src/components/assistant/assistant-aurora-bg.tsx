'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const Aurora = dynamic(() => import('./aurora/Aurora'), { ssr: false });

export type AuroraActivity = 'idle' | 'sending' | 'receiving';

const ACTIVITY_PRESETS: Record<
  AuroraActivity,
  { speed: number; amplitude: number; blend: number }
> = {
  idle: { speed: 0.45, amplitude: 0.9, blend: 0.42 },
  sending: { speed: 2.4, amplitude: 1.75, blend: 0.62 },
  receiving: { speed: 1.7, amplitude: 1.45, blend: 0.55 },
};

const MARFYL_AURORA_COLORS: [string, string, string] = ['#2276D2', '#7cff67', '#5227FF'];

export function AssistantAuroraBackground({
  activity,
  className,
}: {
  activity: AuroraActivity;
  className?: string;
}) {
  const [visual, setVisual] = useState(ACTIVITY_PRESETS.idle);
  const decayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisual(ACTIVITY_PRESETS[activity]);
    if (decayRef.current) clearTimeout(decayRef.current);
    if (activity !== 'idle') {
      decayRef.current = setTimeout(() => {
        setVisual(ACTIVITY_PRESETS.idle);
      }, activity === 'sending' ? 1400 : 2200);
    }
    return () => {
      if (decayRef.current) clearTimeout(decayRef.current);
    };
  }, [activity]);

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-80 transition-opacity duration-700',
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(213_60%_8%/0.92)] via-[hsl(var(--dm-b-base)/0.88)] to-[hsl(0_0%_6%/0.95)]" />
      <Aurora
        colorStops={MARFYL_AURORA_COLORS}
        speed={visual.speed}
        amplitude={visual.amplitude}
        blend={visual.blend}
        className="aurora-container absolute inset-0"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,transparent_40%,hsl(0_0%_4%/0.75)_100%)]" />
    </div>
  );
}

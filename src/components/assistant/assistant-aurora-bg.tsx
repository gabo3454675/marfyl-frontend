'use client';

import { cn } from '@/lib/utils';

export type AuroraActivity = 'idle' | 'sending' | 'receiving';

export function AssistantAuroraBackground({
  activity,
  className,
}: {
  activity: AuroraActivity;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#070b12]',
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          'ai-aurora-scene absolute inset-0 transition-[filter] duration-[1.8s] ease-out',
          activity === 'sending' && 'ai-aurora-scene--sending',
          activity === 'receiving' && 'ai-aurora-scene--receiving',
        )}
      >
        <div className="ai-aurora-blob ai-aurora-blob--blue" />
        <div className="ai-aurora-blob ai-aurora-blob--green" />
        <div className="ai-aurora-blob ai-aurora-blob--violet" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#070b12]/30 via-transparent to-[#05080f]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_110%,transparent_30%,#05080f_85%)]" />
    </div>
  );
}

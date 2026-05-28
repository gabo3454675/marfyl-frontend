'use client';

import { cn } from '@/lib/utils';

/**
 * Orbes de luz animados (CSS) — efecto “dark materials” en movimiento.
 * Sin librerías extra: solo keyframes en globals.css.
 */
export function DmAmbientMotion({
  palette = 'a',
  className,
  intensity = 'normal',
}: {
  palette?: 'a' | 'b';
  className?: string;
  intensity?: 'subtle' | 'normal' | 'strong';
}) {
  return (
    <div
      className={cn(
        'dm-ambient-layer pointer-events-none absolute inset-0 overflow-hidden',
        intensity === 'subtle' && 'dm-ambient-subtle',
        intensity === 'strong' && 'dm-ambient-strong',
        className,
      )}
      aria-hidden
    >
      <div className={cn('dm-ambient-orb dm-orb-1', palette === 'b' && 'dm-palette-b')} />
      <div className={cn('dm-ambient-orb dm-orb-2', palette === 'b' && 'dm-palette-b')} />
      <div className={cn('dm-ambient-orb dm-orb-3', palette === 'b' && 'dm-palette-b')} />
    </div>
  );
}

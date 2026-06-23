'use client';

import { cn } from '@/lib/utils';

type DmZone = 'app' | 'fiscal' | 'assistant' | 'marketing';

/**
 * Superficie Dark Materials: elevación, borde luminoso y ruido sutil.
 */
export function DmSurface({
  children,
  className,
  zone = 'app',
  elevation = 'md',
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  zone?: DmZone;
  elevation?: 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article';
}) {
  return (
    <Tag
      data-dm-zone={zone}
      className={cn(
        'dm-surface dm-surface-shimmer relative',
        elevation === 'sm' && 'dm-elev-sm',
        elevation === 'md' && 'dm-elev-md',
        elevation === 'lg' && 'dm-elev-lg',
        zone === 'fiscal' && 'dm-zone-fiscal',
        zone === 'assistant' && 'dm-zone-assistant',
        zone === 'marketing' && 'dm-zone-marketing',
        className,
      )}
    >
      <span className="dm-surface-noise pointer-events-none" aria-hidden />
      <span className="dm-surface-highlight pointer-events-none" aria-hidden />
      <div className="relative z-[1]">{children}</div>
    </Tag>
  );
}

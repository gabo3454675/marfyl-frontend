'use client';

import { cn } from '@/lib/utils';
import { DmSurface } from '@/components/ui/dm-surface';

type AdminPanelProps = {
  children: React.ReactNode;
  className?: string;
  zone?: 'app' | 'fiscal';
  elevation?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  as?: 'div' | 'section' | 'article';
};

/** Panel administrativo con Dark Materials (shimmer, ruido, borde luminoso). */
export function AdminPanel({
  children,
  className,
  zone = 'app',
  elevation = 'md',
  interactive = false,
  as = 'div',
}: AdminPanelProps) {
  return (
    <DmSurface
      as={as}
      zone={zone === 'fiscal' ? 'fiscal' : 'app'}
      elevation={elevation}
      className={cn(
        'admin-panel',
        interactive && 'admin-panel-interactive cursor-pointer',
        className,
      )}
    >
      {children}
    </DmSurface>
  );
}

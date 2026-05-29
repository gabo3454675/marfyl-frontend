'use client';

import Link from 'next/link';
import { isFiscalPreviewMode } from '@/lib/fiscal-preview';

/** En dev preview: permite alternar entre sitio marketing y app sin redirección forzada. */
export function MarketingPreviewBar() {
  if (!isFiscalPreviewMode()) return null;

  return (
    <div className="relative z-[45] shrink-0 border-b border-[hsl(var(--dm-b-accent)/0.35)] bg-[hsl(var(--dm-b-accent)/0.12)] px-4 py-2 text-center text-xs text-[hsl(var(--dm-b-accent))]">
      <span className="text-muted-foreground">Vista previa · Paleta marketing (coral)</span>
      {' · '}
      <Link href="/" className="font-semibold underline hover:no-underline">
        Ir a la app (dashboard)
      </Link>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { isFiscalPreviewMode } from '@/lib/fiscal-preview';

export function DevAppSwitcher() {
  if (!isFiscalPreviewMode()) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-500/30 bg-amber-400/90 px-3 py-2 text-center text-xs font-medium text-amber-950 dark:bg-amber-500/15 dark:text-amber-100">
      <span>Vista previa sin login · Paleta app (cashmere)</span>
      <Link href="/empresa" className="underline font-semibold hover:no-underline">
        Ver sitio marketing
      </Link>
      <Link href="/fiscal/calendario" className="underline hover:no-underline">
        Fiscal
      </Link>
    </div>
  );
}

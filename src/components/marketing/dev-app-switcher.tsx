'use client';

import Link from 'next/link';
import { isFiscalPreviewMode } from '@/lib/fiscal-preview';

export function DevAppSwitcher() {
  if (!isFiscalPreviewMode()) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-blue-500/30 bg-blue-500/90 px-3 py-2 text-center text-xs font-medium text-blue-950 dark:bg-blue-500/15 dark:text-blue-100">
      <span>Vista previa sin login · Paleta app (blue)</span>
      <Link href="/empresa" className="underline font-semibold hover:no-underline">
        Ver sitio marketing
      </Link>
      <Link href="/fiscal/calendario" className="underline hover:no-underline">
        Fiscal
      </Link>
    </div>
  );
}

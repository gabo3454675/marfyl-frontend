'use client';

import Link from 'next/link';
import { isFiscalPreviewMode } from '@/lib/fiscal-preview';

/** En dev preview: permite alternar entre sitio marketing y app sin redirección forzada. */
export function MarketingPreviewBar() {
  if (!isFiscalPreviewMode()) return null;

  return (
    <div className="relative z-[45] shrink-0 border-b border-blue-200 bg-blue-50 px-4 py-2 text-center text-xs text-blue-600">
      <span className="text-slate-500">Vista previa · Paleta marketing (azul)</span>
      {' · '}
      <Link href="/dashboard" className="font-semibold underline hover:no-underline">
        Ir a la app (dashboard)
      </Link>
    </div>
  );
}

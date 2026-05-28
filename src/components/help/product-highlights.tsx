'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { MARFYL_BRAND, MARKETING_HOME_PATH, PRODUCT_FEATURES } from '@/lib/content/marketing-copy';

export function ProductHighlights() {
  return (
    <div className="hidden lg:flex flex-col justify-center space-y-8 pr-8 text-left max-w-md">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">{MARFYL_BRAND.name}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{MARFYL_BRAND.tagline}</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">{MARFYL_BRAND.description}</p>
      </div>
      <ul className="space-y-4">
        {PRODUCT_FEATURES.map((f) => (
          <li key={f.id} className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[hsl(var(--dm-b-accent))] mt-0.5" />
            <div>
              <p className="font-medium text-sm">{f.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{f.description}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
        <Link href={MARKETING_HOME_PATH} className="text-[hsl(var(--dm-b-accent))] font-medium hover:underline inline-flex items-center gap-1">
          Sitio MARFYL
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Link href="/register" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
          Crear cuenta
          <ArrowRight className="h-3 w-3" />
        </Link>
      </p>
    </div>
  );
}

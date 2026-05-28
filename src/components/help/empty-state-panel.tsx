'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyStatePanel({
  title,
  description,
  tips,
  primaryCta,
  secondaryCta,
}: {
  title: string;
  description: string;
  tips?: string[];
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl border border-dashed border-emerald-500/35 bg-emerald-500/5">
      <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mb-3" />
      <p className="font-semibold text-base">{title}</p>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">{description}</p>
      {tips && tips.length > 0 && (
        <ul className="mt-4 text-sm text-muted-foreground text-left max-w-sm space-y-1.5">
          {tips.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="text-emerald-600">•</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2 mt-6 justify-center">
        {primaryCta && (
          <Button asChild size="sm">
            <Link href={primaryCta.href}>{primaryCta.label}</Link>
          </Button>
        )}
        {secondaryCta && (
          <Button asChild variant="outline" size="sm">
            <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

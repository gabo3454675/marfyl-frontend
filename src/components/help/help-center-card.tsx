'use client';

import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentFaqSheet } from '@/components/help/content-faq-sheet';
import { HELP_CENTER_INTRO, MARKETING_HOME_PATH, PRICING_TEASER, PRODUCT_FEATURES } from '@/lib/content/marketing-copy';
import { GENERAL_FAQ } from '@/lib/content/faq-content';
import { Button } from '@/components/ui/button';

export function HelpCenterCard() {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-primary" />
          Centro de ayuda
        </CardTitle>
        <CardDescription>{HELP_CENTER_INTRO}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="grid gap-3 sm:grid-cols-2">
          {PRODUCT_FEATURES.map((f) => (
            <li key={f.id}>
              <Link
                href={f.href}
                className="block rounded-lg border border-border/80 p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors group"
              >
                <p className="font-medium text-sm group-hover:text-primary">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.description}</p>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={MARKETING_HOME_PATH}>Sitio público</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/precios">Planes</Link>
          </Button>
          <ContentFaqSheet
            title="Preguntas frecuentes"
            description="Operación, pagos, tasas y roles en MARFYL."
            items={GENERAL_FAQ}
            triggerLabel="Ver FAQ"
          />
          <Button variant="ghost" size="sm" asChild>
            <a href={PRICING_TEASER.mailto}>
              {PRICING_TEASER.contactLabel}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{PRICING_TEASER.description}</p>
      </CardContent>
    </Card>
  );
}

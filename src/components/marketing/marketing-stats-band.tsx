'use client';

import Link from 'next/link';
import { MessageCircle, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GradientBlinds from '@/components/marketing/gradient-blinds/GradientBlinds';
import {
  FOUNDING_CLIENTS,
  MARFYL_GRADIENT_COLORS,
  MARKETING_STATS,
} from '@/lib/content/marketing-pages';

const TAG_ICONS = {
  chat: MessageCircle,
  wand: Sparkles,
} as const;

export function MarketingStatsBand() {
  const { tags, title, subtitle, cta, items } = MARKETING_STATS;

  return (
    <section className="marketing-stats-band">
      <div className="marketing-stats-band__fx" aria-hidden>
        <GradientBlinds
          gradientColors={[...MARFYL_GRADIENT_COLORS]}
          angle={0}
          noise={0.25}
          blindCount={14}
          blindMinWidth={48}
          spotlightRadius={0.55}
          spotlightSoftness={1.2}
          spotlightOpacity={0.85}
          mouseDampening={0.18}
          distortAmount={0}
          shineDirection="left"
          mixBlendMode="lighten"
        />
      </div>
      <div className="marketing-stats-band__veil" aria-hidden />
      <div className="marketing-container marketing-stats-band__content">
        <div className="marketing-stats-clients">
          {FOUNDING_CLIENTS.map((client) => (
            <div key={client.slug} className="marketing-stats-client">
              <span className="marketing-stats-client__name">{client.name}</span>
              <span className="marketing-stats-client__sector">{client.sector}</span>
            </div>
          ))}
        </div>

        <div className="marketing-stats-layout">
          <div className="marketing-stats-copy">
            <div className="marketing-stats-tags">
              {tags.map((tag) => {
                const Icon = TAG_ICONS[tag.icon];
                return (
                  <span key={tag.label} className="marketing-stats-tag">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {tag.label}
                  </span>
                );
              })}
            </div>
            <h2 className="marketing-stats-title">{title}</h2>
            <p className="marketing-stats-subtitle">{subtitle}</p>
            <Button size="lg" variant="secondary" className="marketing-stats-cta" asChild>
              <Link href={cta.href}>
                {cta.label}
                <Zap className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="marketing-stats-grid">
            {items.map((item) => (
              <div key={item.label} className="marketing-stats-card">
                <p className="marketing-stats-card__value">{item.value}</p>
                <p className="marketing-stats-card__label">{item.label}</p>
                <p className="marketing-stats-card__detail">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { MessageCircle, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  MarketingReveal,
  MarketingStagger,
  MarketingStaggerItem,
} from '@/components/marketing/marketing-reveal';
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
    <section className="markyl-stats-band">
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
      <div className="markyl-stats-band__veil" aria-hidden />
      <div className="marketing-container markyl-stats-band__content">
        <MarketingStagger className="markyl-stats-clients">
          {FOUNDING_CLIENTS.map((client) => (
            <MarketingStaggerItem key={client.slug}>
              <div className="markyl-stats-client">
                <span className="markyl-stats-client__name">{client.name}</span>
                <span className="markyl-stats-client__sector">{client.sector}</span>
              </div>
            </MarketingStaggerItem>
          ))}
        </MarketingStagger>

        <div className="markyl-stats-layout">
          <MarketingReveal variant="slide-right" className="markyl-stats-copy">
            <div className="markyl-stats-tags">
              {tags.map((tag) => {
                const Icon = TAG_ICONS[tag.icon];
                return (
                  <span key={tag.label} className="markyl-stats-tag">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {tag.label}
                  </span>
                );
              })}
            </div>
            <h2 className="markyl-stats-title">{title}</h2>
            <p className="markyl-stats-subtitle">{subtitle}</p>
            <Button size="lg" variant="secondary" className="markyl-stats-cta" asChild>
              <Link href={cta.href}>
                {cta.label}
                <Zap className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </MarketingReveal>

          <MarketingStagger className="markyl-stats-grid">
            {items.map((item) => (
              <MarketingStaggerItem key={item.label}>
                <div className="markyl-stats-card h-full">
                  <p className="markyl-stats-card__value">{item.value}</p>
                  <p className="markyl-stats-card__label">{item.label}</p>
                  <p className="markyl-stats-card__detail">{item.detail}</p>
                </div>
              </MarketingStaggerItem>
            ))}
          </MarketingStagger>
        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band';
import { MarketingFaq } from '@/components/marketing/marketing-faq';
import { MarketingHeroGlow } from '@/components/marketing/marketing-hero-glow';
import {
  MarketingReveal,
  MarketingStagger,
  MarketingStaggerItem,
} from '@/components/marketing/marketing-reveal';
import { MarketingStatsBand } from '@/components/marketing/marketing-stats-band';
import { MARKETING_FAQ_HOME, MARKETING_HOME } from '@/lib/content/marketing-pages';

export function EmpresaPageContent() {
  const { hero, features, highlights, trust, cta } = MARKETING_HOME;

  return (
    <>
      <section className="marketing-hero">
        <MarketingHeroGlow />
        <div className="marketing-container marketing-hero__content">
          <MarketingStagger className="max-w-3xl" onMount stagger={0.12}>
            <MarketingStaggerItem>
              <p className="marketing-hero-eyebrow text-sm font-semibold uppercase tracking-wider inline-flex items-center gap-2 px-4 py-1.5 rounded-full">
                {hero.eyebrow}
              </p>
            </MarketingStaggerItem>
            <MarketingStaggerItem>
              <h1 className="marketing-hero-title mt-4">{hero.title}</h1>
            </MarketingStaggerItem>
            <MarketingStaggerItem>
              <p className="marketing-hero-subtitle text-lg mt-6 leading-relaxed max-w-2xl">
                {hero.subtitle}
              </p>
            </MarketingStaggerItem>
            <MarketingStaggerItem>
              <div className="flex flex-wrap gap-3 mt-8">
                <Button size="lg" className="marketing-cta border-0" asChild>
                  <Link href={hero.primaryCta.href}>
                    {hero.primaryCta.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="marketing-outline-btn" asChild>
                  <a href={hero.secondaryCta.href}>{hero.secondaryCta.label}</a>
                </Button>
              </div>
            </MarketingStaggerItem>
          </MarketingStagger>
        </div>
      </section>

      <section className="marketing-section marketing-section--band">
        <div className="marketing-container">
          <MarketingStagger className="marketing-features-grid">
            {features.map((f) => (
              <MarketingStaggerItem key={f.title}>
                <div className="marketing-feature-card card-elevated hover-lift h-full">
                  <h2 className="font-semibold text-lg">{f.title}</h2>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.description}</p>
                </div>
              </MarketingStaggerItem>
            ))}
          </MarketingStagger>
        </div>
      </section>

      <section className="marketing-section marketing-container">
        <div className="grid gap-10 lg:gap-14 lg:grid-cols-2 lg:items-start">
          <MarketingReveal variant="slide-right">
            <h2 className="marketing-section-title">Hecho para la operación diaria</h2>
            <ul className="mt-6 space-y-3.5">
              {highlights.map((h, i) => (
                <MarketingReveal key={h} variant="fade-up" delay={i * 0.06}>
                  <li className="flex gap-3 text-sm leading-relaxed">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    {h}
                  </li>
                </MarketingReveal>
              ))}
            </ul>
            <Button className="mt-8" variant="secondary" asChild>
              <Link href="/caracteristicas">Ver todas las características</Link>
            </Button>
          </MarketingReveal>

          <MarketingStagger className="marketing-trust-grid">
            {trust.map((t) => (
              <MarketingStaggerItem key={t.label}>
                <div className="flex gap-4 rounded-xl border border-border p-5 sm:p-6 bg-card hover-lift h-full">
                  {t.label.includes('Venezuela') ? (
                    <Shield className="h-8 w-8 shrink-0 text-primary" />
                  ) : (
                    <Zap className="h-8 w-8 shrink-0 text-primary" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold">{t.label}</p>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{t.detail}</p>
                  </div>
                </div>
              </MarketingStaggerItem>
            ))}
          </MarketingStagger>
        </div>
      </section>

      <MarketingStatsBand />
      <MarketingFaq items={MARKETING_FAQ_HOME} />
      <MarketingCtaBand
        title={cta.title}
        subtitle={cta.subtitle}
        primary={cta.primary}
        secondary={cta.secondary}
      />
    </>
  );
}

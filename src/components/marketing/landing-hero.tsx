'use client';

import Link from 'next/link';
import { MarketingHeroGlow } from './marketing-hero-glow';
import { MarketingReveal } from './marketing-reveal';
import { LANDING_PAGE } from '@/lib/content/marketing-pages';

export function LandingHero() {
  const { hero } = LANDING_PAGE;

  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32 lg:py-40">
      {/* Fondo decorativo — MarketingHeroGlow no acepta props, envolvemos para opacidad */}
      <div className="absolute inset-0 opacity-30">
        <MarketingHeroGlow />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Eyebrow */}
          <MarketingReveal variant="fade-up" delay={0} onMount>
            <span className="inline-flex items-center gap-x-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700">
              {hero.eyebrow}
            </span>
          </MarketingReveal>

          {/* Headline con gradiente */}
          <MarketingReveal variant="fade-up" delay={0.1} onMount>
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-sky-600 to-sky-800 bg-clip-text text-transparent">
                {hero.title}
              </span>
            </h1>
          </MarketingReveal>

          {/* Subtítulo */}
          <MarketingReveal variant="fade-up" delay={0.2} onMount>
            <p className="mt-6 text-lg leading-8 text-slate-600 sm:text-xl">
              {hero.subtitle}
            </p>
          </MarketingReveal>

          {/* CTAs */}
          <MarketingReveal variant="fade-up" delay={0.3} onMount>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={hero.primaryCta.href}
                aria-label={hero.primaryCta.label}
                className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                {hero.primaryCta.label}
              </Link>
              <Link
                href={hero.secondaryCta.href}
                aria-label={hero.secondaryCta.label}
                className="inline-flex items-center justify-center rounded-lg border border-sky-600 px-6 py-3 text-sm font-semibold text-sky-600 transition-all hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                {hero.secondaryCta.label}
              </Link>
            </div>
          </MarketingReveal>
        </div>
      </div>
    </section>
  );
}

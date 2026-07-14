'use client';

import Link from 'next/link';
import { MarketingReveal } from './marketing-reveal';
import { LANDING_PAGE } from '@/lib/content/marketing-pages';

export function LandingCtaFinal() {
  const { cta, trust } = LANDING_PAGE;

  return (
    <section className="relative bg-white py-20 sm:py-28">
      {/* Borde superior sutil */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <MarketingReveal variant="fade-up">
          <div className="mx-auto max-w-3xl text-center">
            {/* Headline con gradiente */}
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              <span className="bg-gradient-to-r from-sky-600 to-sky-800 bg-clip-text text-transparent">
                {cta.title}
              </span>
            </h2>

            {/* Subtítulo */}
            <p className="mt-4 text-lg text-slate-600">{cta.subtitle}</p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={cta.primary.href}
                className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                {cta.primary.label}
              </Link>
              <Link
                href={cta.secondary.href}
                className="inline-flex items-center justify-center rounded-lg border border-sky-600 px-6 py-3 text-sm font-semibold text-sky-600 transition-all hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                {cta.secondary.label}
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {trust.map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </MarketingReveal>
      </div>
    </section>
  );
}

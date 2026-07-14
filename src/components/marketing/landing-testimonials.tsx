'use client';

import { motion } from 'framer-motion';
import { MarketingReveal, MarketingStagger, MarketingStaggerItem } from './marketing-reveal';
import { LANDING_PAGE } from '@/lib/content/marketing-pages';

function TestimonialCard({
  quote,
  author,
  role,
  company,
  metric,
  metricLabel,
}: {
  quote: string;
  author: string;
  role: string;
  company: string;
  metric: string;
  metricLabel: string;
}) {
  return (
    <MarketingStaggerItem>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {/* Quote */}
        <blockquote className="text-sm leading-relaxed text-slate-600 italic">
          &ldquo;{quote}&rdquo;
        </blockquote>

        {/* Author */}
        <div className="mt-6">
          <div className="text-sm font-semibold text-slate-900">{author}</div>
          <div className="text-xs text-slate-500">
            {role} · {company}
          </div>
        </div>

        {/* Metric */}
        <div className="mt-4 rounded-lg bg-sky-50 p-3">
          <div className="text-2xl font-bold text-sky-600">{metric}</div>
          <div className="text-xs text-sky-700">{metricLabel}</div>
        </div>
      </motion.div>
    </MarketingStaggerItem>
  );
}

export function LandingTestimonials() {
  const { testimonials } = LANDING_PAGE;

  return (
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <MarketingReveal variant="fade-up">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Lo que dicen nuestros clientes
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Negocios reales operando con confianza en MARFYL.
            </p>
          </div>
        </MarketingReveal>

        {/* Cards */}
        <MarketingReveal variant="fade-up" delay={0.1}>
          <MarketingStagger>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <TestimonialCard key={t.author} {...t} />
              ))}
            </div>
          </MarketingStagger>
        </MarketingReveal>
      </div>
    </section>
  );
}

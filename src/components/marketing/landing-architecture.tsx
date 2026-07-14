'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { MarketingReveal } from './marketing-reveal';
import { LANDING_PAGE } from '@/lib/content/marketing-pages';

function StepCard({
  step,
  index,
  total,
}: {
  step: { label: string; description: string };
  index: number;
  total: number;
}) {
  const stepNumber = String(index + 1).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="relative flex flex-col items-center text-center"
    >
      {/* Número de paso */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
        {stepNumber}
      </div>

      {/* Label */}
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{step.label}</h3>

      {/* Descripción */}
      <p className="mt-1 text-xs text-slate-500">{step.description}</p>

      {/* Flecha de conexión horizontal (desktop) */}
      {index < total - 1 && (
        <div className="absolute right-0 top-6 hidden translate-x-[calc(100%+8px)] text-sky-300 lg:block">
          <ArrowRight className="h-5 w-5" />
        </div>
      )}

      {/* Línea de conexión vertical (mobile) */}
      {index < total - 1 && (
        <div className="mt-4 h-8 w-px bg-sky-200 lg:hidden" />
      )}
    </motion.div>
  );
}

export function LandingArchitecture() {
  const { architecture } = LANDING_PAGE;

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <MarketingReveal variant="fade-up">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {architecture.title}
            </h2>
            <p className="mt-4 text-lg text-slate-600">{architecture.subtitle}</p>
          </div>
        </MarketingReveal>

        {/* Timeline — un solo grid responsive */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-4">
          {architecture.steps.map((step, i) => (
            <StepCard
              key={step.label}
              step={step}
              index={i}
              total={architecture.steps.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

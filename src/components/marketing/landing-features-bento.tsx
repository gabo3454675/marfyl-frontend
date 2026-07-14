'use client';

import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Package,
  FileText,
  Scale,
  Bot,
  type LucideIcon,
} from 'lucide-react';
import {
  MarketingReveal,
  MarketingStagger,
  MarketingStaggerItem,
} from './marketing-reveal';
import { LANDING_PAGE } from '@/lib/content/marketing-pages';

type IconName = 'ShoppingCart' | 'Package' | 'FileText' | 'Scale' | 'Bot';
const ICON_MAP: Record<IconName, LucideIcon> = {
  ShoppingCart,
  Package,
  FileText,
  Scale,
  Bot,
};

type BentoCardProps = {
  icon: IconName;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
};

function BentoCard({
  icon,
  title,
  description,
  metric,
  metricLabel,
}: BentoCardProps) {
  const Icon = ICON_MAP[icon] ?? Package;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg hover:shadow-sky-100"
    >
      {/* Icono */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-100">
        <Icon className="h-6 w-6" />
      </div>

      {/* Título */}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>

      {/* Descripción */}
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {description}
      </p>

      {/* Métrica */}
      <div className="mt-4 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
          {metric}
        </span>
        <span className="text-xs text-slate-500">{metricLabel}</span>
      </div>

      {/* Borde de brillo en hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-transparent transition-colors group-hover:border-sky-200" />
    </motion.div>
  );
}

export function LandingFeaturesBento() {
  const { featuresBento } = LANDING_PAGE;

  return (
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <MarketingReveal variant="fade-up">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Todo lo que tu negocio necesita
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Un solo sistema para la operación diaria y el cumplimiento fiscal.
            </p>
          </div>
        </MarketingReveal>

        {/* Bento Grid */}
        <MarketingReveal variant="fade-up" delay={0.1}>
          <MarketingStagger className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuresBento.map((feature) => (
              <MarketingStaggerItem
                key={feature.id}
                className={feature.span === 'large' ? 'lg:col-span-2' : undefined}
              >
                <BentoCard {...feature} />
              </MarketingStaggerItem>
            ))}
          </MarketingStagger>
        </MarketingReveal>
      </div>
    </section>
  );
}

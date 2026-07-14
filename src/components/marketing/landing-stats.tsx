'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { MarketingReveal } from './marketing-reveal';
import { LANDING_PAGE } from '@/lib/content/marketing-pages';

function useCounter(end: number, duration: number = 1500, shouldAnimate: boolean = true) {
  const [count, setCount] = useState(shouldAnimate ? 0 : end);

  useEffect(() => {
    if (!shouldAnimate) {
      setCount(end);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, shouldAnimate]);

  return count;
}

function StatCard({
  value,
  suffix,
  label,
  detail,
  index,
}: {
  value: number;
  suffix: string;
  label: string;
  detail: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = !shouldReduceMotion && isInView;
  const count = useCounter(value, 1500, shouldAnimate);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="text-center"
    >
      <div className="text-4xl font-bold tracking-tight text-sky-600 sm:text-5xl">
        {count}
        {suffix}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{label}</div>
      <div className="mt-1 text-xs text-slate-500">{detail}</div>
    </motion.div>
  );
}

export function LandingStats() {
  const { stats } = LANDING_PAGE;

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <MarketingReveal variant="fade-up">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} {...stat} index={i} />
            ))}
          </div>
        </MarketingReveal>
      </div>
    </section>
  );
}

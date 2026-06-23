'use client';

import Link from 'next/link';
import { Check, ShoppingCart, Package, FileText, BarChart3, Scale, Bot, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band';
import { MarketingFaq } from '@/components/marketing/marketing-faq';
import {
  MarketingReveal,
  MarketingStagger,
  MarketingStaggerItem,
} from '@/components/marketing/marketing-reveal';
import { CARACTERISTICAS_PAGE, MARKETING_HOME } from '@/lib/content/marketing-pages';

const SECTION_ICONS: Record<string, React.ElementType> = {
  pos: ShoppingCart,
  inventory: Package,
  billing: FileText,
  finance: BarChart3,
  fiscal: Scale,
  ai: Bot,
  team: Users,
};

type FaqItem = { id: string; question: string; answer: string };

export function CaracteristicasPageContent({ faqItems }: { faqItems: FaqItem[] }) {
  const { header, sections, stats } = CARACTERISTICAS_PAGE;

  return (
    <>
      <MarketingReveal variant="blur-up" onMount>
        <header className="marketing-page-header marketing-container">
          <h1 className="marketing-hero-title">{header.title}</h1>
          <p className="text-muted-foreground mt-4 text-lg">{header.subtitle}</p>
        </header>
      </MarketingReveal>

      <div className="marketing-container space-y-12 pb-16">
        {sections.map((section, i) => {
          const Icon = SECTION_ICONS[section.id] || Check;
          return (
            <MarketingReveal
              key={section.id}
              variant={i % 2 === 0 ? 'slide-right' : 'slide-left'}
              delay={0.05}
            >
              <article
                className={`grid gap-8 lg:grid-cols-2 items-center ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium mb-3 border-[#10b981]/25 bg-[#10b981]/8 text-[#34d399]">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {section.title}
                  </div>
                  <h2 className="text-xl font-bold text-[#f0f0f0]">{section.title}</h2>
                  <ul className="mt-4 space-y-2">
                    {section.bullets.map((b) => (
                      <li key={b} className="flex gap-2 text-sm text-[#f0f0f0]/60">
                        <Check className="h-4 w-4 shrink-0 text-[#10b981] mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className={`rounded-2xl border p-6 flex flex-col items-center justify-center min-h-[160px] ${i % 2 === 1 ? 'lg:order-1' : ''} border-[#10b981]/10 bg-[#10b981]/[0.03]`}
                >
                  <Icon className="h-10 w-10 text-[#10b981]/40 mb-3" aria-hidden />
                  <p className="text-sm text-center text-[#f0f0f0]/40 max-w-xs leading-relaxed">
                    {section.bullets.length} funcionalidades clave para optimizar la {section.title.toLowerCase()} de tu negocio
                  </p>
                </div>
              </article>
            </MarketingReveal>
          );
        })}
      </div>

      <section className="border-y py-16 sm:py-20" style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#0e0f14' }}>
        <div className="marketing-container text-center">
          <MarketingReveal variant="fade-up">
            <h2 className="text-xl sm:text-2xl font-bold text-[#f0f0f0]">{stats.title}</h2>
          </MarketingReveal>
          <MarketingStagger className="grid gap-6 md:grid-cols-3 mt-10">
            {stats.items.map((item) => (
              <MarketingStaggerItem key={item.label}>
                <div className="rounded-xl border p-5 text-left h-full transition-colors duration-300" style={{ borderColor: 'rgba(16,185,129,0.12)', background: 'rgba(16,185,129,0.04)' }}>
                  <p className="font-semibold text-[#f0f0f0]">{item.label}</p>
                  <p className="text-sm mt-2" style={{ color: 'rgba(240,240,240,0.5)' }}>{item.detail}</p>
                </div>
              </MarketingStaggerItem>
            ))}
          </MarketingStagger>
        </div>
      </section>

      <MarketingFaq title="Preguntas sobre el producto" items={faqItems} />

      <MarketingReveal className="marketing-container text-center pb-8">
        <Button className="markyl-cta border-0 !text-[#0c0d10]" asChild>
          <Link href="/precios">Ver planes y precios</Link>
        </Button>
      </MarketingReveal>

      <MarketingCtaBand
        title={MARKETING_HOME.cta.title}
        subtitle={MARKETING_HOME.cta.subtitle}
        primary={MARKETING_HOME.cta.primary}
        secondary={MARKETING_HOME.cta.secondary}
      />
    </>
  );
}

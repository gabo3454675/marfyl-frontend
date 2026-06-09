'use client';

import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band';
import { MarketingFaq } from '@/components/marketing/marketing-faq';
import { MarketingPricingGlow } from '@/components/marketing/marketing-pricing-glow';
import { MarketingReveal } from '@/components/marketing/marketing-reveal';
import { PricingCards, PricingComparison } from '@/components/marketing/pricing-table';
import { MARKETING_HOME, PRICING_PAGE } from '@/lib/content/marketing-pages';

type FaqItem = { id: string; question: string; answer: string };

export function PreciosPageContent({ faqItems }: { faqItems: FaqItem[] }) {
  const { header, plans, comparisonRows } = PRICING_PAGE;

  return (
    <>
      <MarketingReveal variant="blur-up" onMount>
        <header className="marketing-page-header marketing-container">
          <h1 className="marketing-hero-title">{header.title}</h1>
          <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">{header.subtitle}</p>
        </header>
      </MarketingReveal>

      <section className="marketing-pricing-section">
        <MarketingPricingGlow />
        <div className="marketing-container marketing-pricing-section__content pb-12">
          <PricingCards plans={[...plans]} />
        </div>
      </section>

      <MarketingReveal className="marketing-container pb-20">
        <h2 className="text-xl font-bold mb-6 text-center">Comparativa de planes</h2>
        <PricingComparison rows={comparisonRows} />
      </MarketingReveal>

      <MarketingFaq title="Preguntas sobre facturación y planes" items={faqItems} />

      <MarketingCtaBand
        title="Solicita demo o activa tu prueba"
        subtitle="Cuéntanos el tamaño de tu operación y te proponemos el plan adecuado."
        primary={{ label: 'Crear cuenta', href: '/register' }}
        secondary={{ label: 'Consultar planes', href: MARKETING_HOME.cta.secondary.href }}
      />
    </>
  );
}

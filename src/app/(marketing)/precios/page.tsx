import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band';
import { MarketingFaq } from '@/components/marketing/marketing-faq';
import { PricingCards, PricingComparison } from '@/components/marketing/pricing-table';
import { MARKETING_HOME, PRICING_PAGE } from '@/lib/content/marketing-pages';
import { GENERAL_FAQ } from '@/lib/content/faq-content';

const PRICING_FAQ = [
  ...GENERAL_FAQ.filter((f) => f.id === 'payments' || f.id === 'roles'),
  {
    id: 'upgrade',
    question: '¿Puedo cambiar de plan después?',
    answer:
      'Sí. Los upgrades se acuerdan con el equipo comercial según usuarios, módulo fiscal y volumen de operación.',
  },
  {
    id: 'tax-invoice',
    question: '¿El precio incluye impuestos?',
    answer:
      'La cotización indica si el monto es más IVA u otro tributo aplicable según la facturación del servicio MARFYL.',
  },
];

export default function PreciosPage() {
  const { header, plans, comparisonRows } = PRICING_PAGE;

  return (
    <>
      <header className="marketing-page-header marketing-container">
        <h1 className="marketing-hero-title">{header.title}</h1>
        <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">{header.subtitle}</p>
      </header>

      <section className="marketing-container pb-12">
        <PricingCards plans={[...plans]} />
      </section>

      <section className="marketing-container pb-20">
        <h2 className="text-xl font-bold mb-6 text-center">Comparativa de planes</h2>
        <PricingComparison rows={comparisonRows} />
      </section>

      <MarketingFaq title="Preguntas sobre facturación y planes" items={PRICING_FAQ} />

      <MarketingCtaBand
        title="Solicita demo o activa tu prueba"
        subtitle="Cuéntanos el tamaño de tu operación y te proponemos el plan adecuado."
        primary={{ label: 'Crear cuenta', href: '/register' }}
        secondary={{ label: 'Consultar planes', href: MARKETING_HOME.cta.secondary.href }}
      />
    </>
  );
}

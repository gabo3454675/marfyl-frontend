import { PreciosPageContent } from '@/components/marketing/precios-page-content';
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
  return <PreciosPageContent faqItems={PRICING_FAQ} />;
}

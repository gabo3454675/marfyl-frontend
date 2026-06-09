import { CaracteristicasPageContent } from '@/components/marketing/caracteristicas-page-content';
import { MARKETING_FAQ_HOME } from '@/lib/content/marketing-pages';
import { GENERAL_FAQ } from '@/lib/content/faq-content';

export default function CaracteristicasPage() {
  return (
    <CaracteristicasPageContent
      faqItems={[...MARKETING_FAQ_HOME, ...GENERAL_FAQ.slice(0, 2)]}
    />
  );
}

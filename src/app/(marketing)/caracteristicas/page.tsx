import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band';
import { MarketingFaq } from '@/components/marketing/marketing-faq';
import { CARACTERISTICAS_PAGE, MARKETING_HOME, MARKETING_FAQ_HOME } from '@/lib/content/marketing-pages';
import { GENERAL_FAQ } from '@/lib/content/faq-content';

export default function CaracteristicasPage() {
  const { header, sections, stats } = CARACTERISTICAS_PAGE;

  return (
    <>
      <header className="marketing-page-header marketing-container">
        <h1 className="marketing-hero-title">{header.title}</h1>
        <p className="text-muted-foreground mt-4 text-lg">{header.subtitle}</p>
      </header>

      <div className="marketing-container space-y-12 pb-16">
        {sections.map((section, i) => (
          <article
            key={section.id}
            className={`grid gap-8 lg:grid-cols-2 items-center ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
          >
            <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
              <h2 className="text-xl font-bold">{section.title}</h2>
              <ul className="mt-4 space-y-2">
                {section.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-[hsl(var(--marketing-accent))] mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className={`rounded-2xl border border-dashed border-[hsl(var(--marketing-accent)/0.35)] bg-[hsl(var(--marketing-accent)/0.06)] min-h-[140px] flex items-center justify-center p-8 ${i % 2 === 1 ? 'lg:order-1' : ''}`}
            >
              <p className="text-sm text-center text-muted-foreground max-w-xs">
                Vista de la app: <span className="font-medium text-foreground">{section.title}</span>
              </p>
            </div>
          </article>
        ))}
      </div>

      <section className="marketing-section bg-muted/30 border-y border-border/50">
        <div className="marketing-container text-center">
          <h2 className="marketing-section-title">{stats.title}</h2>
          <div className="grid gap-6 md:grid-cols-3 mt-10">
            {stats.items.map((item) => (
              <div key={item.label} className="marketing-feature-card text-left">
                <p className="font-semibold">{item.label}</p>
                <p className="text-sm text-muted-foreground mt-2">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFaq title="Preguntas sobre el producto" items={[...MARKETING_FAQ_HOME, ...GENERAL_FAQ.slice(0, 2)]} />

      <div className="marketing-container text-center pb-8">
        <Button className="marketing-cta" asChild>
          <Link href="/precios">Ver planes y precios</Link>
        </Button>
      </div>

      <MarketingCtaBand
        title={MARKETING_HOME.cta.title}
        subtitle={MARKETING_HOME.cta.subtitle}
        primary={MARKETING_HOME.cta.primary}
        secondary={MARKETING_HOME.cta.secondary}
      />
    </>
  );
}

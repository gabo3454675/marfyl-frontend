import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band';
import { MarketingFaq } from '@/components/marketing/marketing-faq';
import { MARKETING_FAQ_HOME, MARKETING_HOME } from '@/lib/content/marketing-pages';

export default function EmpresaPage() {
  const { hero, features, highlights, trust, cta } = MARKETING_HOME;

  return (
    <>
      <section className="marketing-hero marketing-container">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/25 inline-flex items-center gap-2 px-4 py-1.5 rounded-full">
            {hero.eyebrow}
          </p>
          <h1 className="marketing-hero-title mt-4 text-foreground">{hero.title}</h1>
          <p className="text-lg text-muted-foreground mt-6 leading-relaxed max-w-2xl">{hero.subtitle}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button size="lg" className="marketing-cta border-0" asChild>
              <Link href={hero.primaryCta.href}>
                {hero.primaryCta.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="marketing-outline-btn" asChild>
              <a href={hero.secondaryCta.href}>{hero.secondaryCta.label}</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="marketing-section marketing-section--band">
        <div className="marketing-container">
          <div className="marketing-features-grid">
            {features.map((f) => (
              <div key={f.title} className="marketing-feature-card card-elevated hover-lift">
                <h2 className="font-semibold text-lg">{f.title}</h2>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-section marketing-container">
        <div className="grid gap-10 lg:gap-14 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="marketing-section-title">Hecho para la operación diaria</h2>
            <ul className="mt-6 space-y-3.5">
              {highlights.map((h) => (
                <li key={h} className="flex gap-3 text-sm leading-relaxed">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  {h}
                </li>
              ))}
            </ul>
            <Button className="mt-8" variant="secondary" asChild>
              <Link href="/caracteristicas">Ver todas las características</Link>
            </Button>
          </div>
          <div className="marketing-trust-grid">
            {trust.map((t) => (
              <div
                key={t.label}
                className="flex gap-4 rounded-xl border border-border p-5 sm:p-6 bg-card hover-lift"
              >
                {t.label.includes('Venezuela') ? (
                  <Shield className="h-8 w-8 shrink-0 text-primary" />
                ) : (
                  <Zap className="h-8 w-8 shrink-0 text-primary" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold">{t.label}</p>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFaq items={MARKETING_FAQ_HOME} />
      <MarketingCtaBand
        title={cta.title}
        subtitle={cta.subtitle}
        primary={cta.primary}
        secondary={cta.secondary}
      />
    </>
  );
}

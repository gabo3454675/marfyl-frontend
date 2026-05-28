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
      <section className="marketing-container pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--marketing-accent))]">
            {hero.eyebrow}
          </p>
          <h1 className="marketing-hero-title mt-4">{hero.title}</h1>
          <p className="text-lg text-muted-foreground mt-6 leading-relaxed">{hero.subtitle}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button size="lg" className="marketing-cta" asChild>
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

      <section className="marketing-section border-y border-[hsl(var(--dm-b-accent)/0.12)] bg-[hsl(0_0%_8%/_0.5)]">
        <div className="marketing-container grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="marketing-feature-card">
              <h2 className="font-semibold text-lg">{f.title}</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="marketing-container py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="marketing-section-title">Hecho para la operación diaria</h2>
            <ul className="mt-6 space-y-3">
              {highlights.map((h) => (
                <li key={h} className="flex gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[hsl(var(--marketing-accent))]" />
                  {h}
                </li>
              ))}
            </ul>
            <Button className="mt-8" variant="secondary" asChild>
              <Link href="/caracteristicas">Ver todas las características</Link>
            </Button>
          </div>
          <div className="grid gap-4">
            {trust.map((t) => (
              <div key={t.label} className="flex gap-4 rounded-xl border border-border/80 p-5 bg-card">
                {t.label.includes('Venezuela') ? (
                  <Shield className="h-8 w-8 text-[hsl(var(--marketing-accent))]" />
                ) : (
                  <Zap className="h-8 w-8 text-[hsl(var(--marketing-accent))]" />
                )}
                <div>
                  <p className="font-semibold">{t.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFaq items={MARKETING_FAQ_HOME} />
      <MarketingCtaBand title={cta.title} subtitle={cta.subtitle} primary={cta.primary} secondary={cta.secondary} />
    </>
  );
}

'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Cpu, Zap, Gauge, Shield, CalendarCheck, FileSearch, DollarSign, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band';
import { MarketingFaq } from '@/components/marketing/marketing-faq';
import { MarketingHeroGlow } from '@/components/marketing/marketing-hero-glow';
import { MarketingReveal, MarketingStagger, MarketingStaggerItem } from '@/components/marketing/marketing-reveal';
import { MarketingStatsBand } from '@/components/marketing/marketing-stats-band';
import { MarketingChatSimulator } from '@/components/marketing/marketing-chat-simulator';
import { MARKETING_FAQ_HOME, MARKETING_HOME } from '@/lib/content/marketing-pages';

const PAIN_POINT_ICONS = [CalendarCheck, FileSearch, DollarSign, BrainCircuit];

export function EmpresaPageContent() {
  const { hero, features, highlights, trust, painPoints, simulatorQuestions, architecture, cta } = MARKETING_HOME;

  return (
    <>
      {/* ── HERO ─────────────────────────────── */}
      <section className="markyl-hero">
        <MarketingHeroGlow />
        <div className="marketing-container markyl-hero__grid">
          <div className="markyl-hero__copy">
            <MarketingStagger onMount stagger={0.12}>
              <MarketingStaggerItem>
                <p className="markyl-hero-eyebrow">{hero.eyebrow}</p>
              </MarketingStaggerItem>
              <MarketingStaggerItem>
                <h1 className="markyl-hero-title">{hero.title}</h1>
              </MarketingStaggerItem>
              <MarketingStaggerItem>
                <p className="markyl-hero-subtitle">{hero.subtitle}</p>
              </MarketingStaggerItem>
              <MarketingStaggerItem>
                <div className="markyl-hero-actions">
                  <Button size="lg" className="markyl-cta" asChild>
                    <Link href={hero.primaryCta.href}>
                      {hero.primaryCta.label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="markyl-outline-btn" asChild>
                    <a href={hero.secondaryCta.href}>{hero.secondaryCta.label}</a>
                  </Button>
                </div>
              </MarketingStaggerItem>
            </MarketingStagger>
          </div>
          <div className="markyl-hero__widget">
            <MarketingReveal variant="slide-left">
              <MarketingChatSimulator />
            </MarketingReveal>
          </div>
        </div>
      </section>

      {/* ── PAIN POINT BENTO GRID ─────────────── */}
      <section className="markyl-bento-section">
        <div className="marketing-container">
          <MarketingReveal>
            <h2 className="markyl-section-label">Problemas reales que Marfyl resuelve</h2>
          </MarketingReveal>
          <div className="markyl-bento-grid">
            {painPoints.map((p, i) => {
              const Icon = PAIN_POINT_ICONS[i % PAIN_POINT_ICONS.length];
              return (
                <MarketingReveal key={p.title} variant="fade-up" delay={i * 0.07}>
                  <div className={`markyl-bento-card ${i === 0 ? 'markyl-bento-card--featured' : ''}`}>
                    <div className="markyl-bento-icon">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="markyl-bento-title">{p.title}</h3>
                    <p className="markyl-bento-desc">{p.description}</p>
                    <div className="markyl-bento-metric">
                      <span className="markyl-bento-metric-value">{p.metric}</span>
                      <span className="markyl-bento-metric-label">{p.metricLabel}</span>
                    </div>
                  </div>
                </MarketingReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES / HIGHLIGHTS ─────────────── */}
      <section className="markyl-section markyl-section--alt">
        <div className="marketing-container">
          <div className="grid gap-10 lg:gap-14 lg:grid-cols-2 lg:items-start">
            <MarketingReveal variant="slide-right">
              <h2 className="markyl-section-title">Ingeniería fiscal con precisión absoluta</h2>
              <ul className="mt-6 space-y-3.5">
                {highlights.map((h, i) => (
                  <MarketingReveal key={h} variant="fade-up" delay={i * 0.06}>
                    <li className="flex gap-3 text-sm leading-relaxed">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                      {h}
                    </li>
                  </MarketingReveal>
                ))}
              </ul>
              <Button className="mt-8" variant="secondary" asChild>
                <Link href="/caracteristicas">Explorar características técnicas</Link>
              </Button>
            </MarketingReveal>

            <MarketingStagger className="grid gap-4">
              {trust.map((t) => (
                <MarketingStaggerItem key={t.label}>
                  <div className="flex gap-4 rounded-xl border border-white/10 p-5 sm:p-6 bg-white/[0.03] hover-lust h-full">
                    <Shield className="h-8 w-8 shrink-0 text-emerald-500" />
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{t.label}</p>
                      <p className="text-sm text-white/60 mt-1.5 leading-relaxed">{t.detail}</p>
                    </div>
                  </div>
                </MarketingStaggerItem>
              ))}
            </MarketingStagger>
          </div>
        </div>
      </section>

      {/* ── TECHNICAL ARCHITECTURE ────────────── */}
      <section className="markyl-arch-section">
        <div className="marketing-container">
          <MarketingReveal>
            <h2 className="markyl-section-label">{architecture.title}</h2>
            <p className="markyl-arch-subtitle">{architecture.subtitle}</p>
          </MarketingReveal>
          <div className="markyl-arch-flow">
            {architecture.steps.map((step, i) => (
              <MarketingReveal key={step.label} variant="fade-up" delay={i * 0.1}>
                <div className="markyl-arch-step">
                  <div className="markyl-arch-step-number">{i + 1}</div>
                  <div className="markyl-arch-step-content">
                    <div className="markyl-arch-step-label">{step.label}</div>
                    <div className="markyl-arch-step-desc">{step.description}</div>
                  </div>
                  {i < architecture.steps.length - 1 && (
                    <div className="markyl-arch-arrow">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </MarketingReveal>
            ))}
          </div>
          <div className="markyl-arch-badge">
            <Cpu className="h-4 w-4" />
            <span>Sincronizado nativamente con el COT y Gacetas Oficiales</span>
          </div>
        </div>
      </section>

      <MarketingStatsBand />
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

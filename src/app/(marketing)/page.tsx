import type { Metadata } from 'next';
import { LandingHero } from '@/components/marketing/landing-hero';
import { LandingStats } from '@/components/marketing/landing-stats';
import { LandingFeaturesBento } from '@/components/marketing/landing-features-bento';
import { LandingArchitecture } from '@/components/marketing/landing-architecture';
import { LandingTestimonials } from '@/components/marketing/landing-testimonials';
import { LandingCtaFinal } from '@/components/marketing/landing-cta-final';

export const metadata: Metadata = {
  title: 'MARFYL — Gestión Fiscal y Operativa para Negocios en Venezuela',
  description:
    'POS táctil, inventario en tiempo real, facturación automatizada y cumplimiento SENIAT. Todo lo que tu negocio necesita para operar sin sorpresas.',
};

function SectionDivider() {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-root">
      <LandingHero />
      <SectionDivider />
      <LandingStats />
      <SectionDivider />
      <LandingFeaturesBento />
      <SectionDivider />
      <LandingArchitecture />
      <SectionDivider />
      <LandingTestimonials />
      <SectionDivider />
      <LandingCtaFinal />
    </div>
  );
}

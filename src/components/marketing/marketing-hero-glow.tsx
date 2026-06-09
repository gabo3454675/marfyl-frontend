'use client';

import GradientBlinds from '@/components/marketing/gradient-blinds/GradientBlinds';
import { MARFYL_GRADIENT_COLORS } from '@/lib/content/marketing-pages';

/** Fondo animado del hero: GradientBlinds con reacción al cursor. */
export function MarketingHeroGlow() {
  return (
    <>
      <div className="marketing-hero-fx marketing-hero-fx--blinds" aria-hidden>
        <GradientBlinds
          gradientColors={[...MARFYL_GRADIENT_COLORS]}
          angle={0}
          noise={0.22}
          blindCount={14}
          blindMinWidth={44}
          spotlightRadius={0.55}
          spotlightSoftness={1.1}
          spotlightOpacity={0.9}
          mouseDampening={0.12}
          distortAmount={0}
          shineDirection="left"
          mixBlendMode="lighten"
        />
      </div>
      <div className="marketing-hero-fade" aria-hidden />
    </>
  );
}

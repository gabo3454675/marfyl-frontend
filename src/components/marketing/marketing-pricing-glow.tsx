'use client';

import Orb from '@/components/marketing/orb/Orb';

/** Orbe interactivo de fondo para la sección de planes. */
export function MarketingPricingGlow() {
  return (
    <div className="marketing-pricing-fx" aria-hidden>
      <Orb
        hue={205}
        hoverIntensity={0.5}
        rotateOnHover
        backgroundColor="#080d14"
      />
    </div>
  );
}

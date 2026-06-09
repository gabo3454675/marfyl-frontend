import type { Metadata } from 'next';
import { MarketingNavbar } from '@/components/marketing/marketing-navbar';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingPreviewBar } from '@/components/marketing/marketing-preview-bar';
import { MarketingMobileNav } from '@/components/marketing/marketing-mobile-nav';
import { MarketingPageTransition } from '@/components/marketing/marketing-page-transition';
import { DmAmbientMotion } from '@/components/ui/dm-ambient-motion';
import { MARFYL_BRAND } from '@/lib/content/marketing-pages';

export const metadata: Metadata = {
  title: {
    default: `${MARFYL_BRAND.name} — ${MARFYL_BRAND.tagline}`,
    template: `%s | ${MARFYL_BRAND.name}`,
  },
  description: MARFYL_BRAND.description,
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-root">
      <DmAmbientMotion palette="a" intensity="subtle" />
      <div className="marketing-chrome">
        <MarketingNavbar />
        <MarketingPreviewBar />
      </div>
      <main className="marketing-main mesh-gradient-bg bg-[hsl(var(--background))]">
        <MarketingPageTransition>
          <div className="marketing-page-flow">{children}</div>
          <MarketingFooter />
        </MarketingPageTransition>
      </main>
      <MarketingMobileNav />
    </div>
  );
}

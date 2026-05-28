import type { Metadata } from 'next';
import { MarketingNavbar } from '@/components/marketing/marketing-navbar';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingPreviewBar } from '@/components/marketing/marketing-preview-bar';
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
      <DmAmbientMotion palette="b" intensity="subtle" />
      <MarketingNavbar />
      <MarketingPreviewBar />
      <main className="marketing-main">{children}</main>
      <MarketingFooter />
    </div>
  );
}

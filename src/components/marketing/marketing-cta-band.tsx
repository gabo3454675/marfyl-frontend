'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { MarketingReveal } from '@/components/marketing/marketing-reveal';

export function MarketingCtaBand({
  title,
  subtitle,
  primary,
  secondary,
}: {
  title: string;
  subtitle: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}) {
  const secondaryExternal = secondary.href.startsWith('mailto:');

  return (
    <section className="marketing-section marketing-container pb-4 sm:pb-6">
      <MarketingReveal variant="scale">
        <div className="markyl-cta-band">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0c0d10]">{title}</h2>
          <p className="mt-3 max-w-xl mx-auto text-[#0c0d10]/70">{subtitle}</p>
          <div className="markyl-cta-band__actions flex flex-wrap justify-center gap-3 mt-8">
            <Button size="lg" className="markyl-cta !bg-[#0c0d10] !text-[#10b981] !shadow-none hover:!bg-[#1a1d23] w-full sm:w-auto min-h-[48px]" asChild>
              <Link href={primary.href}>
                {primary.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="!border-[#0c0d10]/30 !text-[#0c0d10] hover:!bg-[#0c0d10]/5 w-full sm:w-auto min-h-[48px]" asChild>
              {secondaryExternal ? (
                <a href={secondary.href}>{secondary.label}</a>
              ) : (
                <Link href={secondary.href}>{secondary.label}</Link>
              )}
            </Button>
          </div>
        </div>
      </MarketingReveal>
    </section>
  );
}

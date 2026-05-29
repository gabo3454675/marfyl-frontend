import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

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
      <div className="rounded-2xl border border-[hsl(var(--marketing-accent)/0.35)] bg-gradient-to-br from-[hsl(var(--marketing-accent)/0.12)] to-primary/5 px-6 py-10 sm:py-12 md:px-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">{subtitle}</p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Button size="lg" className="marketing-cta" asChild>
            <Link href={primary.href}>
              {primary.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          {secondaryExternal ? (
            <Button size="lg" variant="outline" asChild>
              <a href={secondary.href}>{secondary.label}</a>
            </Button>
          ) : (
            <Button size="lg" variant="outline" asChild>
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

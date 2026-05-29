import Link from 'next/link';
import { MARFYL_BRAND, MARKETING_NAV } from '@/lib/content/marketing-pages';
import { PRICING_TEASER } from '@/lib/content/marketing-copy';

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-container py-10 sm:py-12 grid gap-8 sm:gap-10 md:grid-cols-3">
        <div>
          <p className="font-bold text-lg">{MARFYL_BRAND.name}</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
            {MARFYL_BRAND.description}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Sitio
          </p>
          <ul className="space-y-2.5 text-sm">
            {MARKETING_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="hover:text-[hsl(var(--marketing-accent))] transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/login" className="hover:text-[hsl(var(--marketing-accent))] transition-colors">
                Acceso a la app
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Contacto
          </p>
          <a
            href={PRICING_TEASER.mailto}
            className="text-sm font-medium text-[hsl(var(--marketing-accent))] hover:underline"
          >
            {PRICING_TEASER.contactLabel}
          </a>
          <p className="text-xs text-muted-foreground mt-4">
            © {new Date().getFullYear()} {MARFYL_BRAND.name}. Venezuela.
          </p>
        </div>
      </div>
    </footer>
  );
}

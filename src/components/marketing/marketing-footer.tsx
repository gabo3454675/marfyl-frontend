import Link from 'next/link';
import { MARFYL_BRAND, MARKETING_NAV } from '@/lib/content/marketing-pages';
import { PRICING_TEASER } from '@/lib/content/marketing-copy';
import { MarfylLogo } from '@/components/brand/marfyl-logo';

export function MarketingFooter() {
  return (
    <footer className="markyl-footer">
      <div className="marketing-container py-10 sm:py-12 grid gap-8 sm:gap-10 md:grid-cols-3">
        <div>
          <MarfylLogo
            wordmarkClassName="text-[#f0f0f0]"
            className="mb-3"
          />
          <p className="text-sm text-[#f0f0f0]/50 mt-2 max-w-xs leading-relaxed">
            {MARFYL_BRAND.description}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#f0f0f0]/40 mb-3">
            Sitio
          </p>
          <ul className="space-y-2.5 text-sm">
            {MARKETING_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-[#f0f0f0]/60 hover:text-[#10b981] transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/login" className="text-[#f0f0f0]/60 hover:text-[#10b981] transition-colors">
                Acceso a la app
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#f0f0f0]/40 mb-3">
            Contacto
          </p>
          <a
            href={PRICING_TEASER.mailto}
            className="text-sm font-medium text-[#10b981] hover:text-[#34d399] transition-colors"
          >
            {PRICING_TEASER.contactLabel}
          </a>
          <p className="text-xs text-[#f0f0f0]/30 mt-4">
            © {new Date().getFullYear()} {MARFYL_BRAND.name}. Venezuela.
          </p>
        </div>
      </div>
    </footer>
  );
}

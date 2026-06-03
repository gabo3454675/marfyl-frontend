import Link from 'next/link';
import { MARFYL_BRAND, MARKETING_NAV } from '@/lib/content/marketing-pages';
import { PRICING_TEASER } from '@/lib/content/marketing-copy';
import { MarfylLogo } from '@/components/brand/marfyl-logo';

export function MarketingFooter() {
  return (
    <footer className="marketing-footer bg-slate-900 text-slate-300">
      <div className="marketing-container py-10 sm:py-12 grid gap-8 sm:gap-10 md:grid-cols-3">
        <div>
          <MarfylLogo
            wordmarkClassName="text-white"
            className="mb-3"
          />
          <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">
            {MARFYL_BRAND.description}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Sitio
          </p>
          <ul className="space-y-2.5 text-sm">
            {MARKETING_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="hover:text-blue-400 transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/login" className="hover:text-blue-400 transition-colors">
                Acceso a la app
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Contacto
          </p>
          <a
            href={PRICING_TEASER.mailto}
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            {PRICING_TEASER.contactLabel}
          </a>
          <p className="text-xs text-slate-500 mt-4">
            © {new Date().getFullYear()} {MARFYL_BRAND.name}. Venezuela.
          </p>
        </div>
      </div>
    </footer>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { MarfylLogo } from '@/components/brand/marfyl-logo';
import { BackToGalleryButton } from '@/components/gallery/back-to-gallery-button';
import { ExchangeRateIndicator } from '@/components/exchange-rate-indicator';
import { useAuthStore } from '@/store/useAuthStore';
import { markExplicitLogout } from '@/lib/fiscal-preview';
import { cn } from '@/lib/utils';

/**
 * Barra superior del modo Galería de Módulos.
 * Sustituye sidebar/topbar: mantiene selector de empresa, home y sesión.
 */
export function GalleryAppBar({
  className,
  homeHref = '/',
  homeLabel = 'Ir a galería de módulos',
  showGalleryBack = true,
}: {
  className?: string;
  /** Inicio autorizado para el rol actual (galería o estación operativa). */
  homeHref?: string;
  homeLabel?: string;
  /** Oculta el retorno a galería en estaciones sin acceso al hub. */
  showGalleryBack?: boolean;
}) {
  const pathname = usePathname() ?? '';
  const logout = useAuthStore((s) => s.logout);
  const isHome = pathname === homeHref || pathname === '';
  const [rateCurrency, setRateCurrency] = useState<'USD' | 'EUR'>('USD');

  const handleLogout = async () => {
    markExplicitLogout();
    await logout();
    window.location.assign('/login');
  };

  return (
    <header
      className={cn(
        'gallery-app-bar sticky top-0 z-30 shrink-0 border-b border-border/60',
        'bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-5 md:px-6">
        <Link
          href={homeHref}
          className={cn(
            'flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 transition-colors',
            'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
          aria-label={homeLabel}
        >
          <MarfylLogo variant="icon" className="shrink-0" />
          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate text-sm font-semibold tracking-tight">
              MARFYL
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {homeHref === '/' ? (isHome ? 'Módulos' : 'Galería') : 'Operación'}
            </span>
          </span>
        </Link>

        {showGalleryBack && !isHome && <BackToGalleryButton />}

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-2.5">
          <OrganizationSwitcher
            variant="gallery"
            className="max-w-[min(100%,18rem)] sm:max-w-[22rem]"
          />
          <div className="hidden shrink-0 items-center rounded-xl border bg-muted/30 p-0.5 sm:flex">
            <button
              type="button"
              onClick={() => setRateCurrency('USD')}
              className={cn(
                'rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors',
                rateCurrency === 'USD'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={rateCurrency === 'USD'}
            >
              USD
            </button>
            <button
              type="button"
              onClick={() => setRateCurrency('EUR')}
              className={cn(
                'rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors',
                rateCurrency === 'EUR'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={rateCurrency === 'EUR'}
            >
              EUR
            </button>
          </div>
          <ExchangeRateIndicator
            currency={rateCurrency}
            className="hidden h-9 min-h-9 shrink-0 gap-1.5 rounded-xl px-2 text-xs sm:inline-flex sm:px-2.5 sm:text-sm"
          />
          <ThemeToggle variant="compact" className="shrink-0" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:text-destructive"
            onClick={() => void handleLogout()}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

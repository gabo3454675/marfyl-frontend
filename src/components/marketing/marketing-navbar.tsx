'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MARKETING_NAV } from '@/lib/content/marketing-pages';
import { MarfylLogo } from '@/components/brand/marfyl-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

export function MarketingNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="marketing-nav glass-navbar sticky top-0 z-50 shrink-0">
      <div className="marketing-container flex h-14 sm:h-16 items-center justify-between gap-3 sm:gap-4">
        <MarfylLogo href="/empresa" priority className="min-w-0 max-w-[55%] sm:max-w-none" />

        <nav className="hidden md:flex items-center gap-1">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <ThemeToggle variant="compact" />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login" scroll>
              Iniciar sesión
            </Link>
          </Button>
          <Button size="sm" className="markyl-cta border-0 !text-[#0c0d10]" asChild>
            <Link href="/register" scroll>
              Crear cuenta
            </Link>
          </Button>
        </div>

        <div className="flex md:hidden items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" className="h-10 px-2.5 text-xs font-semibold" asChild>
            <Link href="/login" scroll onClick={() => setOpen(false)}>
              Entrar
            </Link>
          </Button>
          <ThemeToggle variant="compact" />
          <button
            type="button"
            className="marketing-mobile-menu-btn"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              className="marketing-mobile-backdrop md:hidden"
              aria-label="Cerrar menú"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="marketing-mobile-drawer md:hidden"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {MARKETING_NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn('marketing-mobile-drawer__link', active && 'marketing-mobile-drawer__link--active')}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="marketing-mobile-drawer__actions">
                <ThemeToggle variant="full" />
                <Button variant="outline" className="w-full min-h-[44px]" asChild>
                  <Link href="/login" scroll onClick={() => setOpen(false)}>
                    Iniciar sesión
                  </Link>
                </Button>
                <Button className="markyl-cta border-0 w-full min-h-[44px] !text-[#0c0d10]" asChild>
                  <Link href="/register" scroll onClick={() => setOpen(false)}>
                    Crear cuenta
                  </Link>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

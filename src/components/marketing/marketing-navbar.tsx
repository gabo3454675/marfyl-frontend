'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MARKETING_NAV } from '@/lib/content/marketing-pages';
import { MarfylLogo } from '@/components/brand/marfyl-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

export function MarketingNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button size="sm" className="marketing-cta border-0" asChild>
            <Link href="/register">Crear cuenta</Link>
          </Button>
        </div>

        <div className="flex md:hidden items-center gap-1 shrink-0">
          <ThemeToggle variant="compact" />
          <button
            type="button"
            className="p-2 rounded-md border border-border text-foreground"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block py-2 text-sm font-medium text-foreground"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <ThemeToggle variant="full" />
            <Button variant="outline" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button className="marketing-cta border-0" asChild>
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

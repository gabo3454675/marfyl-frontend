'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MARFYL_BRAND, MARKETING_NAV } from '@/lib/content/marketing-pages';
import { cn } from '@/lib/utils';

export function MarketingNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="marketing-nav sticky top-0 z-50">
      <div className="marketing-container flex h-16 items-center justify-between gap-4">
        <Link href="/empresa" className="font-bold text-lg tracking-tight">
          <span className="text-[hsl(var(--dm-b-accent))]">{MARFYL_BRAND.name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'text-[hsl(var(--dm-b-accent))] bg-[hsl(var(--dm-b-accent)/0.12)]'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button size="sm" className="marketing-cta" asChild>
            <Link href="/register">Crear cuenta</Link>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden p-2 rounded-md border border-border"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[hsl(var(--dm-b-accent)/0.15)] bg-[hsl(0_0%_10%/_0.98)] px-4 py-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block py-2 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button className="marketing-cta" asChild>
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, LogOut } from 'lucide-react';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { MarfylLogo } from '@/components/brand/marfyl-logo';
import { useAuthStore } from '@/store/useAuthStore';
import { markExplicitLogout } from '@/lib/fiscal-preview';
import { cn } from '@/lib/utils';

/**
 * Barra superior del modo Galería de Módulos.
 * Sustituye sidebar/topbar: mantiene selector de empresa, home y sesión.
 */
export function GalleryAppBar({ className }: { className?: string }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const isHome = pathname === '/' || pathname === '';

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
          href="/"
          className={cn(
            'flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 transition-colors',
            'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
          aria-label="Ir a galería de módulos"
        >
          <MarfylLogo variant="icon" className="shrink-0" />
          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate text-sm font-semibold tracking-tight">
              MARFYL
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {isHome ? 'Módulos' : 'Galería'}
            </span>
          </span>
        </Link>

        {!isHome && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden h-9 gap-1.5 rounded-xl text-muted-foreground sm:inline-flex"
            onClick={() => router.push('/')}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Módulos
          </Button>
        )}

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-2.5">
          <OrganizationSwitcher
            variant="gallery"
            className="max-w-[min(100%,18rem)] sm:max-w-[22rem]"
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

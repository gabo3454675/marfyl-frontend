'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { MarfylLogo } from '@/components/brand/marfyl-logo';
import { useAuthStore } from '@/store/useAuthStore';
import {
  clearSessionCookie,
  readSessionCookieFromDocument,
} from '@/lib/auth-session-cookie';

export function AuthLayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated && readSessionCookieFromDocument()) {
      clearSessionCookie();
    }

    if (
      isAuthenticated &&
      (pathname === '/login' || pathname === '/register')
    ) {
      router.replace('/');
    }
  }, [hasHydrated, isAuthenticated, pathname, router]);

  return (
    <div className="auth-shell flex min-h-[100dvh] flex-col bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 mesh-gradient-bg" />
      <div className="pointer-events-none absolute top-[-10%] left-[15%] h-[500px] w-[500px] animate-pulse rounded-full bg-blue-200/40 opacity-30 mix-blend-multiply blur-3xl filter dark:bg-blue-600/20 dark:mix-blend-normal" />
      <div
        className="pointer-events-none absolute bottom-[-5%] right-[10%] h-[400px] w-[400px] animate-pulse rounded-full bg-blue-100/50 opacity-25 mix-blend-multiply blur-3xl filter dark:bg-blue-900/30 dark:mix-blend-normal"
        style={{ animationDelay: '1s' }}
      />

      <header className="relative z-[2] flex w-full max-w-6xl shrink-0 items-center justify-between px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 mx-auto">
        <MarfylLogo href="/empresa" />
        <ThemeToggle variant="compact" />
      </header>

      <div className="auth-shell__scroll relative z-[1] min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
        <div className="flex min-h-full w-full items-start justify-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:items-center lg:py-12">
          <div className="grid w-full max-w-5xl items-start gap-8 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-center lg:gap-14">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

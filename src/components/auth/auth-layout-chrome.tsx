'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { MarfylLogo } from '@/components/brand/marfyl-logo';

export function AuthLayoutChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 mesh-gradient-bg pointer-events-none" />
      <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-blue-200/40 dark:bg-blue-600/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 animate-pulse pointer-events-none" />
      <div
        className="absolute bottom-[-5%] right-[10%] w-[400px] h-[400px] bg-blue-100/50 dark:bg-blue-900/30 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-25 animate-pulse pointer-events-none"
        style={{ animationDelay: '1s' }}
      />

      <header className="relative z-[2] flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto w-full">
        <MarfylLogo href="/empresa" />
        <ThemeToggle variant="compact" />
      </header>

      <div className="relative z-[1] flex-1 flex items-center justify-center px-4 pb-12 w-full">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1fr_minmax(0,28rem)] gap-10 lg:gap-14 items-center">
          {children}
        </div>
      </div>
    </div>
  );
}

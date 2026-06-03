'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useThemeStore } from '@/store/useThemeStore';
import {
  applyThemeClass,
  readPersistedTheme,
  resolveThemeForPath,
} from '@/lib/theme-storage';

/**
 * Sincroniza el tema con <html class="dark"> y persiste la elección del usuario
 * en localStorage (marfyl-theme) para marketing + app operativa.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const syncInitial = () => {
      const saved = readPersistedTheme();
      if (!saved) {
        const initial = resolveThemeForPath(window.location.pathname);
        if (useThemeStore.getState().theme !== initial) {
          setTheme(initial);
        }
      }
      applyThemeClass(useThemeStore.getState().theme);
      setHydrated(true);
    };

    if (useThemeStore.persist.hasHydrated()) {
      syncInitial();
      return;
    }

    return useThemeStore.persist.onFinishHydration(syncInitial);
  }, [setTheme]);

  useEffect(() => {
    if (!hydrated) return;
    applyThemeClass(theme);
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (readPersistedTheme()) return;
    const next = resolveThemeForPath(pathname);
    if (useThemeStore.getState().theme !== next) {
      setTheme(next);
    }
  }, [pathname, hydrated, setTheme]);

  return <>{children}</>;
}

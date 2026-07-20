'use client';

import { useCallback, useEffect, useState } from 'react';
import { APP_NAV_SECTIONS } from '@/config/app-nav';

const STORAGE_KEY = 'marfyl-nav-sections-open-v2';

function loadStored(): Record<string, boolean> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : null;
  } catch {
    return null;
  }
}

/** Solo abre el hub de la ruta actual; el resto cerrado hasta que el usuario lo abra. */
function buildDefaults(activeSectionId: string | null): Record<string, boolean> {
  const stored = loadStored();
  const defaults: Record<string, boolean> = {};
  for (const section of APP_NAV_SECTIONS) {
    defaults[section.id] = section.id === activeSectionId;
  }
  if (!stored) return defaults;

  // Preferencias del usuario, pero forzamos abierto el hub activo
  return {
    ...defaults,
    ...stored,
    ...(activeSectionId ? { [activeSectionId]: true } : {}),
  };
}

function persist(map: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/**
 * Estado colapsable de secciones del menú (sidebar + sheet móvil).
 * Persiste preferencias del usuario; abre la sección activa al navegar.
 */
export function useNavSectionsOpen(activeSectionId: string | null) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    buildDefaults(activeSectionId),
  );

  useEffect(() => {
    if (!activeSectionId) return;
    setOpenMap((prev) => {
      if (prev[activeSectionId]) return prev;
      const next = { ...prev, [activeSectionId]: true };
      persist(next);
      return next;
    });
  }, [activeSectionId]);

  const isOpen = useCallback(
    (sectionId: string) => openMap[sectionId] ?? false,
    [openMap],
  );

  const toggle = useCallback((sectionId: string) => {
    setOpenMap((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      persist(next);
      return next;
    });
  }, []);

  return { isOpen, toggle };
}

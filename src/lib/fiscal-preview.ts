import { clearSessionCookie, setSessionCookie } from '@/lib/auth-session-cookie';

const PREVIEW_FLAG_KEY = 'marfyl_preview';

/** Desarrollo: app completa sin login (POS, facturas, fiscal, etc.). */
export function isFiscalPreviewMode(): boolean {
  if (process.env.NEXT_PUBLIC_FISCAL_PREVIEW === 'true') return true;
  if (process.env.NEXT_PUBLIC_FISCAL_PREVIEW === 'false') return false;
  if (typeof window !== 'undefined') {
    const w = window as Window & { __MARFYL_FISCAL_PREVIEW__?: boolean };
    if (w.__MARFYL_FISCAL_PREVIEW__ === true) return true;
    try {
      if (localStorage.getItem(PREVIEW_FLAG_KEY) === 'true') {
        w.__MARFYL_FISCAL_PREVIEW__ = true;
        return true;
      }
    } catch {
      /* ignore */
    }
  }
  return false;
}

/** Solo vista previa dev; no usar org real de producción. */
export const FISCAL_PREVIEW_ORG_ID = 3;
export const FISCAL_PREVIEW_ORG_SLUG = 'monddy';

export const FISCAL_PREVIEW_TOKEN = 'dev-preview-token';

export const EXPLICIT_LOGOUT_FLAG = 'marfyl_explicit_logout';

export function isExplicitLogout(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(EXPLICIT_LOGOUT_FLAG) === '1';
  } catch {
    return false;
  }
}

export function markExplicitLogout(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(EXPLICIT_LOGOUT_FLAG, '1');
    // También setear cookie temporal para que el middleware (server-side) lo vea
    document.cookie = `${EXPLICIT_LOGOUT_FLAG}=1; path=/; max-age=60; SameSite=Lax`;
  } catch {
    /* sessionStorage no disponible, ignorar */
  }
}

export function clearExplicitLogout(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(EXPLICIT_LOGOUT_FLAG);
    // También limpiar la cookie
    document.cookie = `${EXPLICIT_LOGOUT_FLAG}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    /* ignorar */
  }
}

export function seedFiscalPreviewAuth(): void {
  if (!isFiscalPreviewMode() || typeof window === 'undefined') return;
  if (isExplicitLogout()) return;
  const { useAuthStore } = require('@/store/useAuthStore') as typeof import('@/store/useAuthStore');
  const store = useAuthStore.getState();
  if (store.isAuthenticated && store.token === FISCAL_PREVIEW_TOKEN) return;
  store.setAuth(
    {
      id: 0,
      email: 'preview@marfyl.local',
      fullName: 'Vista previa (dev)',
      organizations: [
        {
          id: FISCAL_PREVIEW_ORG_ID,
          name: 'Vista previa (dev)',
          slug: FISCAL_PREVIEW_ORG_SLUG,
          plan: 'PRO',
          role: 'ADMIN',
          currencyCode: 'USD',
          currencySymbol: '$',
          exchangeRate: 40.5,
        },
      ],
    },
    FISCAL_PREVIEW_TOKEN,
  );
  if (!store.selectedOrganizationId) {
    store.selectOrganization(FISCAL_PREVIEW_ORG_ID);
  }
  setSessionCookie();
  store.setHasHydrated(true);
}

/**
 * Si Preview está OFF pero quedó la sesión sintética "Vista previa (dev)",
 * la limpia para forzar login real y listar orgs de staging.
 */
export function clearStaleFiscalPreviewAuth(): boolean {
  if (typeof window === 'undefined') return false;
  if (isFiscalPreviewMode()) return false;

  try {
    localStorage.setItem(PREVIEW_FLAG_KEY, 'false');
  } catch {
    /* ignore */
  }
  const w = window as Window & { __MARFYL_FISCAL_PREVIEW__?: boolean };
  w.__MARFYL_FISCAL_PREVIEW__ = false;

  const { useAuthStore } = require('@/store/useAuthStore') as typeof import('@/store/useAuthStore');
  const store = useAuthStore.getState();
  const token =
    store.token ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null);
  const isPreviewSession =
    token === FISCAL_PREVIEW_TOKEN ||
    store.user?.email === 'preview@marfyl.local' ||
    store.user?.organizations?.some((o) => o.name === 'Vista previa (dev)');

  // También detectar sesión preview aún no hidratada en zustand
  let persistedPreview = false;
  try {
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw) as {
        state?: { token?: string; user?: { email?: string; organizations?: { name?: string }[] } };
      };
      const t = parsed?.state?.token;
      const email = parsed?.state?.user?.email;
      const orgName = parsed?.state?.user?.organizations?.[0]?.name;
      persistedPreview =
        t === FISCAL_PREVIEW_TOKEN ||
        email === 'preview@marfyl.local' ||
        orgName === 'Vista previa (dev)';
    }
  } catch {
    /* ignore */
  }

  if (!isPreviewSession && !persistedPreview) return false;

  store.clearAuth();
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth-storage');
  } catch {
    /* ignore */
  }
  clearSessionCookie();
  return true;
}

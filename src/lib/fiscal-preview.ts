import { setSessionCookie } from '@/lib/auth-session-cookie';

/** Desarrollo: app completa sin login (POS, facturas, fiscal, etc.). */
export function isFiscalPreviewMode(): boolean {
  if (process.env.NEXT_PUBLIC_FISCAL_PREVIEW === 'true') return true;
  if (typeof window !== 'undefined') {
    const w = window as Window & { __MARFYL_FISCAL_PREVIEW__?: boolean };
    if (w.__MARFYL_FISCAL_PREVIEW__ === true) return true;
  }
  if (process.env.NEXT_PUBLIC_FISCAL_PREVIEW === 'false') return false;
  return process.env.NODE_ENV === 'development';
}

export const FISCAL_PREVIEW_ORG_ID = 1;

export const FISCAL_PREVIEW_TOKEN = 'dev-preview-token';

export function seedFiscalPreviewAuth(): void {
  if (!isFiscalPreviewMode() || typeof window === 'undefined') return;
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
          name: 'Demo MARFYL',
          slug: 'demo-marfyl',
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

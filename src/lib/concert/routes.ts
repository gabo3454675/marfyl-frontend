import { API_BASE_URL } from '@/lib/config/api-config';

const base = `${API_BASE_URL}/concert/public`;

export const concertPublicRoutes = {
  event: (slug: string) => `${base}/${slug}`,
  hold: (slug: string) => `${base}/${slug}/hold`,
  checkout: (slug: string) => `${base}/${slug}/checkout`,
  order: (slug: string, orderToken: string) => `${base}/${slug}/orden/${orderToken}`,
} as const;

export const concertAdminRoutes = {
  overview: '/concert/admin/overview',
  setup: '/concert/admin/setup',
  syncCatalog: '/concert/admin/sync-catalog',
  orders: '/concert/admin/orders',
  confirm: (id: number) => `/concert/admin/orders/${id}/confirm`,
  scan: '/concert/admin/scan',
  sell: '/concert/admin/sell',
} as const;

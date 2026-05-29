import { API_BASE_URL } from '@/lib/config/api-config';

/** URL absoluta para archivos subidos al API (comprobantes, etc.) */
export function resolveConcertAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}

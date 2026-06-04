import { QueryClient } from '@tanstack/react-query';

/**
 * Instancia singleton de QueryClient para el frontend MARFYL.
 *
 * Defaults pensados para datos de negocio (catálogos, stock, facturas, etc.):
 * - staleTime 30s: evita refetch agresivo en navegación entre vistas del dashboard.
 * - retry 1: un único reintento para errores transitorios de red/5xx.
 * - refetchOnWindowFocus false: el operador suele alternar pestañas/IDLE; no queremos
 *   disparar refetches silenciosos que cambien el estado de la UI sin intención.
 *
 * Las queries individuales pueden sobreescribir estos valores cuando aplique
 * (p. ej. datos cuasi-realtime del POS).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

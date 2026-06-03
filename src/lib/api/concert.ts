import { apiClient } from './client';
import type {
  ConcertPaymentMethod,
  ConcertEventPublic,
  HoldSeatsResponse,
  CheckoutResponse,
  ConcertOrderPublicView,
  ConcertAdminOverview,
  ConcertAdminOrder,
  ScanTicketResult,
} from '@/lib/concert/types';

/* ── Request payload types ────────────────────────────────────────── */

/** Payload para venta directa desde admin. */
export interface AdminSellPayload {
  seatIds: number[];
  buyerName: string;
  buyerIdDocument: string;
  buyerPhone: string;
  buyerEmail?: string;
  paymentMethod: ConcertPaymentMethod;
  paymentReference?: string;
}

/* ── Response types (no cubiertos por @/lib/concert/types) ────────── */

/** Respuesta del endpoint POST /concert/admin/setup. */
export interface ConcertEventSetup {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  venueName?: string | null;
  eventStartsAt: string;
  isActive: boolean;
}

/** Respuesta del endpoint POST /concert/admin/sync-catalog. */
export interface SyncCatalogResult {
  ok: boolean;
  message: string;
}

/* ── Service ──────────────────────────────────────────────────────── */

/**
 * Servicio de concierto. Centraliza las llamadas al API de concierto
 * para las rutas públicas (/concert/public/*) y de administración
 * (/concert/admin/*).
 */
export const concertService = {
  // ─── Público ──────────────────────────────────────────────────────

  /** Detalle de un evento público por slug. */
  getEvent(slug: string): Promise<ConcertEventPublic> {
    return apiClient
      .get<ConcertEventPublic>(`/concert/public/${slug}`)
      .then((res) => res.data);
  },

  /** Reservar asientos temporalmente (hold). */
  holdSeats(slug: string, seatIds: number[]): Promise<HoldSeatsResponse> {
    return apiClient
      .post<HoldSeatsResponse>(`/concert/public/${slug}/hold`, { seatIds })
      .then((res) => res.data);
  },

  /**
   * Checkout con FormData (incluye comprobante de pago opcional).
   * Axios detecta FormData y setea Content-Type automáticamente.
   */
  checkout(slug: string, formData: FormData): Promise<CheckoutResponse> {
    return apiClient
      .post<CheckoutResponse>(`/concert/public/${slug}/checkout`, formData)
      .then((res) => res.data);
  },

  /** Consultar estado de una orden por token público. */
  getOrder(slug: string, orderToken: string): Promise<ConcertOrderPublicView> {
    return apiClient
      .get<ConcertOrderPublicView>(`/concert/public/${slug}/orden/${orderToken}`)
      .then((res) => res.data);
  },

  // ─── Admin ────────────────────────────────────────────────────────

  /** Resumen del dashboard admin (evento + estadísticas). */
  getOverview(): Promise<ConcertAdminOverview> {
    return apiClient
      .get<ConcertAdminOverview>('/concert/admin/overview')
      .then((res) => res.data);
  },

  /** Crear o recrear el evento por defecto. */
  setupEvent(): Promise<ConcertEventSetup> {
    return apiClient
      .post<ConcertEventSetup>('/concert/admin/setup')
      .then((res) => res.data);
  },

  /** Sincronizar catálogo de precios y mesas. */
  syncCatalog(): Promise<SyncCatalogResult> {
    return apiClient
      .post<SyncCatalogResult>('/concert/admin/sync-catalog')
      .then((res) => res.data);
  },

  /** Listar órdenes, opcionalmente filtradas por status. */
  getOrders(status?: string): Promise<ConcertAdminOrder[]> {
    return apiClient
      .get<ConcertAdminOrder[]>('/concert/admin/orders', {
        params: status ? { status } : {},
      })
      .then((res) => res.data);
  },

  /** Confirmar pago de una orden (la marca como PAID y genera tickets). */
  confirmOrder(id: number): Promise<ConcertAdminOrder> {
    return apiClient
      .post<ConcertAdminOrder>(`/concert/admin/orders/${id}/confirm`)
      .then((res) => res.data);
  },

  /** Venta directa desde admin (hold + checkout + confirm en un paso). */
  sell(dto: AdminSellPayload): Promise<ConcertAdminOrder> {
    return apiClient
      .post<ConcertAdminOrder>('/concert/admin/sell', dto)
      .then((res) => res.data);
  },

  /** Escanear código QR de una entrada. */
  scanTicket(qrPayload: string): Promise<ScanTicketResult> {
    return apiClient
      .post<ScanTicketResult>('/concert/admin/scan', { qrPayload })
      .then((res) => res.data);
  },
};

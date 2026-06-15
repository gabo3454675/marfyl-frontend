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
  ConcertTicketScanView,
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

  /** Reservar asientos temporalmente (hold). Reenvía holdToken para extender la misma reserva. */
  holdSeats(
    slug: string,
    seatIds: number[],
    holdToken?: string,
  ): Promise<HoldSeatsResponse> {
    return apiClient
      .post<HoldSeatsResponse>(`/concert/public/${slug}/hold`, {
        seatIds,
        ...(holdToken ? { holdToken } : {}),
      })
      .then((res) => res.data);
  },

  /** Extiende una reserva activa mientras el comprador completa el pago. */
  extendHold(slug: string, holdToken: string): Promise<HoldSeatsResponse> {
    return apiClient
      .post<HoldSeatsResponse>(`/concert/public/${slug}/hold/extend`, {
        holdToken,
      })
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

  /** Vista pública al escanear el QR del boleto (confirmación para el cliente). */
  getTicket(slug: string, ticketToken: string): Promise<ConcertTicketScanView> {
    return apiClient
      .get<ConcertTicketScanView>(`/concert/public/${slug}/boleto/${ticketToken}`)
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

  /** Liberar asientos bloqueados de una mesa (holds u órdenes pendientes). */
  releaseMesa(mesaNumber: number): Promise<SyncCatalogResult & { mesaNumber: number; released: number; cancelledOrders: number }> {
    return apiClient
      .post(`/concert/admin/release-mesa/${mesaNumber}`)
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

  /** Cancelar una orden pendiente (libera los asientos). */
  cancelOrder(id: number): Promise<{ ok: boolean; message: string }> {
    return apiClient
      .post<{ ok: boolean; message: string }>(`/concert/admin/orders/${id}/cancel`)
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

  /** Reenviar email con entradas a un orden pagada. */
  resendEmail(orderId: number): Promise<{ ok: boolean; message: string }> {
    return apiClient
      .post<{ ok: boolean; message: string }>(`/concert/admin/orders/${orderId}/resend-email`)
      .then((res) => res.data);
  },
};

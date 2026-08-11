import type { AxiosResponse } from 'axios';
import type { Invoice, InvoiceItem, Customer } from '@/types/shared-types';
import { apiClient } from './client';

/**
 * Respuesta del endpoint GET /invoices/history.
 * El BE devuelve el invoice completo (findMany sin select restrictivo):
 * siempre incluye `createdAt` y `issueDate` cuando el registro los tiene.
 * `issueDate` puede ser null en filas legacy; la UI muestra "—" en Emisión.
 */
export interface HistoryInvoice extends Omit<Invoice, 'id' | 'createdAt' | 'issueDate'> {
  id: number;
  totalAmount: number | string;
  paymentMethod?: string;
  /**
   * Fecha de emisión/venta (filtro diario y columna Emisión).
   * Opcional/null por legacy; operativa nueva debería enviarla siempre.
   */
  issueDate?: string | Date | null;
  /** Timestamp de creación del registro en sistema (columna Registro). */
  createdAt: string | Date;
  customer: Customer | null;
  items: (InvoiceItem & {
    product: { id: number; name: string } | null;
    quantity?: number | string | null;
    effectiveQuantity?: number | string | null;
    displayQuantity?: number;
  })[];
  paymentLines?: { method: string; amount: number; currency: string }[];
  montoUsd?: number | null;
  montoBs?: number | null;
}

export interface DailySummaryItem {
  date: string;
  totalSales: number;
  byPaymentMethod: Record<string, number>;
  invoiceCount?: number;
  grossSales?: number;
  taxAmount?: number;
  igtfAmount?: number;
  netSales?: number;
  cashTotal?: number;
  creditTotal?: number;
  totalCost?: number;
  totalProfit?: number;
  profitPercent?: number;
  byCurrency?: Record<string, number>;
}

export interface HistoryResponse {
  organizationId: number;
  startDate: string;
  endDate: string;
  dailySummary: DailySummaryItem[];
  invoices: HistoryInvoice[];
}

/**
 * Query params para GET /invoices/history.
 * `startDate` / `endDate` deben ir en wire format `YYYY-MM-DD` (o ISO con T00:00/T23:59),
 * no en formato de display DD/MM/YYYY. Así es compatible con BE viejo (@IsDateString)
 * y BE nuevo (@IsFlexibleDate).
 */
export interface HistoryParams {
  /** Wire: YYYY-MM-DD o ISO 8601 — no DD/MM/YYYY */
  startDate: string;
  /** Wire: YYYY-MM-DD o ISO 8601 — no DD/MM/YYYY */
  endDate: string;
  organizationId?: number;
}

/** Payload para crear factura (POST /invoices) */
export interface CreateInvoicePayload {
  customerId?: number;
  paymentMethod?: string;
  payments?: { method: string; amount: number; currency: string }[];
  items: { productId: number; quantity: number }[];
}

export interface CreateInvoiceResponse {
  id: number;
  [key: string]: unknown;
}

/**
 * Servicio de facturas. Centraliza las llamadas al API y tipa respuestas con shared.
 */
export const invoiceService = {
  /** Listado de facturas de la organización actual */
  getAll(): Promise<Invoice[]> {
    return apiClient.get<Invoice[]>('/invoices').then((res) => res.data);
  },

  /**
   * Historial de ventas por rango (filtro por issueDate; fallback createdAt si null).
   * Cada invoice incluye issueDate + createdAt para UI Emisión/Registro.
   */
  getHistory(params: HistoryParams): Promise<HistoryResponse> {
    const query: Record<string, string> = {
      startDate: params.startDate,
      endDate: params.endDate,
    };
    if (params.organizationId != null) {
      query.organizationId = String(params.organizationId);
    }
    return apiClient.get<HistoryResponse>('/invoices/history', { params: query }).then((res) => res.data);
  },

  /** PDF de una factura. Devuelve la respuesta para que el llamador pueda leer headers (content-type) y detectar errores JSON. */
  getPdf(invoiceId: number): Promise<AxiosResponse<Blob>> {
    return apiClient.get<Blob>(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
  },

  /** Crear factura (POS o sincronización). Devuelve la factura creada con id. */
  create(payload: CreateInvoicePayload): Promise<CreateInvoiceResponse> {
    return apiClient.post<CreateInvoiceResponse>('/invoices', payload).then((res) => res.data);
  },

  /** Eliminar una factura */
  delete(invoiceId: number): Promise<void> {
    return apiClient.delete(`/invoices/${invoiceId}`).then(() => undefined);
  },
};

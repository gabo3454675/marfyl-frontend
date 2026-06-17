import { apiClient } from './client';

export interface CierreAbierto {
  id: number;
  fechaApertura: string;
  montoInicial: number;
  ventasEfectivo: number;
  ventasDigitales: number;
  ventasEfectivoUsd: number;
  ventasEfectivoBs: number;
  ventasPagoMovil: number;
  ventasPos: number;
  autoconsumos: number;
  user?: { id: number; fullName?: string; email?: string };
  notaAutoconsumos?: string;
}

export interface CierreCerrado {
  id: number;
  fechaApertura: string;
  fechaCierre: string;
  estado: string;
  montoInicial: number;
  montoFisico?: number | null;
  montoFisicoUsd?: number | null;
  montoFisicoVes?: number | null;
  diferencia?: number | null;
  diferenciaUsd?: number | null;
  diferenciaVes?: number | null;
  totalUsd?: number | null;
  totalVes?: number | null;
  impreso?: boolean | null;
  observaciones?: string | null;
  user?: { id: number; fullName?: string; email?: string };
}

export interface CierreTicket {
  ticketText: string;
  resumenUrl: string;
  qrDataUrl: string;
}

export interface AperturaPayload {
  montoInicial: number;
}

export interface CierreZPayload {
  montoFisicoUsd: number;
  montoFisicoVes: number;
  observaciones?: string;
}

export const cierreCajaService = {
  getAbierto(): Promise<CierreAbierto | null> {
    return apiClient.get<CierreAbierto | null>('/cierre-caja/abierto').then((r) => r.data ?? null);
  },

  listHistorial(limit = 20): Promise<CierreCerrado[]> {
    return apiClient
      .get<CierreCerrado[]>('/cierre-caja', { params: { estado: 'CLOSED', limit } })
      .then((r) => (Array.isArray(r.data) ? r.data : []));
  },

  apertura(payload: AperturaPayload): Promise<CierreAbierto> {
    return apiClient.post<CierreAbierto>('/cierre-caja/apertura', payload).then((r) => r.data);
  },

  cerrar(payload: CierreZPayload): Promise<CierreCerrado> {
    return apiClient.post<CierreCerrado>('/cierre-caja/cerrar', payload).then((r) => r.data);
  },

  getTicket(cierreId: number, ancho: 58 | 80 = 80): Promise<CierreTicket> {
    return apiClient
      .get<CierreTicket>(`/cierre-caja/${cierreId}/ticket`, { params: { ancho } })
      .then((r) => r.data);
  },

  marcarImpreso(cierreId: number): Promise<void> {
    return apiClient.patch(`/cierre-caja/${cierreId}/marcar-impreso`).then(() => undefined);
  },
};

/** Resumen bimoneda alineado con el backend (montoInicial en USD). */
export interface BoxSummary {
  montoInicial: number;
  cashBs: number;
  cashUsd: number;
  pagoMovil: number;
  zelle: number;
  totalUsd: number;
  totalVes: number;
  exchangeRate: number;
}

export function buildBoxSummary(cierre: CierreAbierto, exchangeRate: number): BoxSummary {
  const montoInicial = Number(cierre.montoInicial ?? 0);
  const cashBs = Number(cierre.ventasEfectivoBs ?? 0);
  const cashUsd = Number(cierre.ventasEfectivoUsd ?? 0);
  const pagoMovil = Number(cierre.ventasPagoMovil ?? 0);
  const zelle = Number(cierre.ventasPos ?? 0);
  return {
    montoInicial,
    cashBs,
    cashUsd,
    pagoMovil,
    zelle,
    totalUsd: montoInicial + cashUsd + zelle,
    totalVes: cashBs + pagoMovil,
    exchangeRate,
  };
}

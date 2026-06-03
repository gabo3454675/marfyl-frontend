import { apiClient } from './client';
import type {
  CalendarApiResponse,
  ComplianceHubApiResponse,
} from '@/types/fiscal-calendar-hub';

/* ── Shared enums ────────────────────────────────────────────────── */

/** Tipo de contribuyente fiscal (replica FiscalTaxpayerType de Prisma). */
export type FiscalTaxpayerType = 'ORDINARIO' | 'ESPECIAL' | 'FORMAL';

/** Estado de un período fiscal. */
export type FiscalPeriodStatus = 'OPEN' | 'CLOSING' | 'CLOSED';

/* ── Profile types ───────────────────────────────────────────────── */

/** Datos de la organización que se devuelven en el perfil fiscal. */
export interface FiscalProfileOrganization {
  taxId: string | null;
  legalName: string | null;
  nombre: string | null;
  isSpecialTaxpayer: boolean;
  isFormalTaxpayer: boolean;
}

/** Datos del perfil fiscal almacenado en fiscal_profiles. */
export interface FiscalProfileData {
  id: number;
  organizationId: number;
  taxId: string | null;
  legalName: string | null;
  taxpayerType: FiscalTaxpayerType;
  isWithholdingAgent: boolean;
  isSubjectToWithholding: boolean;
  rifLastDigit: number | null;
  obligations: unknown;
  controlSeriesPrefix: string;
  nextControlSequence: number;
  economicActivity: string | null;
  branches: unknown;
  lastRulesSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Respuesta de GET /fiscal/profile y POST /fiscal/profile. */
export interface FiscalProfileResponse {
  organization: FiscalProfileOrganization;
  profile: FiscalProfileData | null;
}

/** Payload para POST /fiscal/profile (upsert). */
export interface UpsertFiscalProfilePayload {
  taxId?: string;
  legalName?: string;
  taxpayerType?: FiscalTaxpayerType;
  isWithholdingAgent?: boolean;
  isSubjectToWithholding?: boolean;
  isSpecialTaxpayer?: boolean;
  isFormalTaxpayer?: boolean;
  rifLastDigit?: number;
  controlSeriesPrefix?: string;
  nextControlSequence?: number;
  economicActivity?: string;
  branches?: Record<string, unknown>[];
}

/* ── Dashboard types ─────────────────────────────────────────────── */

/** Período del dashboard fiscal. */
export interface FiscalDashboardPeriod {
  year: number;
  month: number;
  label: string;
  status: FiscalPeriodStatus;
  statusLabel: string;
}

/** Métricas agregadas del dashboard. */
export interface FiscalDashboardMetrics {
  grossSalesUsd: number;
  grossSalesTrendPct: number | null;
  debitFiscalUsd: number;
  debitFiscalBs: number;
  creditFiscalUsd: number;
  creditFiscalBs: number;
  netIvaUsd: number;
  netIvaBs: number;
  salesCount: number;
  purchasesCount: number;
}

/** Elemento de agenda (compromiso fiscal próximo). */
export interface FiscalDashboardAgendaItem {
  dayLabel: string;
  title: string;
  urgency: 'high' | 'medium' | 'low';
  compliance: string;
}

/** Alerta del dashboard. */
export interface FiscalDashboardAlert {
  type: 'error' | 'warning' | 'info';
  message: string;
}

/** Resumen del perfil en el dashboard. */
export interface FiscalDashboardProfile {
  taxId: string | null;
  rifDigit: number | null;
}

/** Metadatos del calendario fiscal. */
export interface FiscalDashboardCalendarioMeta {
  rifDigit: number;
  terminacionIvaDay: number;
  seniatVersion: string;
}

/** Elemento del resumen de cumplimiento. */
export interface FiscalDashboardComplianceItem {
  code: string;
  name: string;
  compliance: string;
  dueDate: string;
}

/** Respuesta completa de GET /fiscal/dashboard. */
export interface FiscalDashboardData {
  period: FiscalDashboardPeriod;
  exchangeRate: number;
  metrics: FiscalDashboardMetrics;
  agenda: FiscalDashboardAgendaItem[];
  alerts: FiscalDashboardAlert[];
  profile: FiscalDashboardProfile;
  calendarioMeta: FiscalDashboardCalendarioMeta;
  complianceSummary: FiscalDashboardComplianceItem[];
}

/* ── Query params ────────────────────────────────────────────────── */

/** Parámetros de consulta para endpoints que reciben year/month. */
export interface FiscalPeriodQuery {
  year?: number;
  month?: number;
}

/* ── Calendar & Compliance shared enums ─────────────────────────── */

/** Eventos de dominio fiscal (espejo de FiscalDomainEventType en Prisma). */
export type FiscalDomainEventType =
  | 'INVOICE_ISSUED'
  | 'PURCHASE_REGISTERED'
  | 'CREDIT_NOTE_CREATED'
  | 'CASH_CLOSE'
  | 'PERIOD_CLOSE'
  | 'PROFILE_CHANGED'
  | 'RULES_SYNCED'
  | 'VALIDATION_BLOCKED'
  | 'VALIDATION_WARNING';

/** Tipo de operación aceptado por el endpoint de validación preventiva. */
export type ComplianceOperation = 'sale' | 'purchase' | 'credit_note' | 'period_close';

/* ── Calendario types ──────────────────────────────────────────── */

/** Parámetros de consulta para el calendario fiscal (reutiliza FiscalPeriodQuery). */
export type FiscalCalendarQuery = FiscalPeriodQuery;

/** Parámetros de sincronización del calendario SENIAT. */
export interface FiscalCalendarioSyncParams {
  /** Forzar resincronización aunque ya existan plantillas. */
  force?: boolean;
}

/** Resultado de la sincronización del calendario (POST /fiscal/calendario/sync). */
export interface FiscalCalendarioSyncResult {
  synced: boolean;
  version?: string;
  obligations?: number;
  norms?: {
    synced: boolean;
    version?: string;
    created?: number;
    superseded?: number;
    message?: string;
  };
}

/* ── Compliance types ──────────────────────────────────────────── */

/** Parámetros de consulta para el hub de compliance (reutiliza FiscalPeriodQuery). */
export type FiscalComplianceQuery = FiscalPeriodQuery;

/** Payload para validación preventiva de operación fiscal. */
export interface FiscalOperationValidationPayload {
  operation: ComplianceOperation;
  taxId?: string;
  documentDate?: string;
  controlNumber?: string;
  amountBs?: number;
}

/** Resultado de la validación de operación fiscal. */
export interface FiscalOperationValidationResult {
  allowed: boolean;
  severity: 'info' | 'warning' | 'critical';
  messages: { code: string; text: string; blocks: boolean }[];
}

/** Payload para emitir un evento fiscal. */
export interface FiscalEventPayload {
  eventType: FiscalDomainEventType;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
}

/** Evento fiscal registrado. */
export interface FiscalEvent {
  id: number;
  organizationId: number;
  eventType: FiscalDomainEventType;
  entityType: string | null;
  entityId: string | null;
  payload: unknown;
  userId: number | null;
  createdAt: string;
}

/** Parámetros de consulta para el log de auditoría fiscal. */
export interface FiscalAuditQuery {
  /** Cantidad máxima de entradas a devolver. */
  limit?: number;
}

/** Entrada de auditoría fiscal. */
export interface FiscalAuditEntry {
  id: number;
  organizationId: number;
  userId: number | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ruleCode: string | null;
  beforeValue: unknown;
  afterValue: unknown;
  systemResponse: unknown;
  userConfirmed: boolean | null;
  createdAt: string;
}

/** Versión de una norma fiscal. */
export interface FiscalNormVersion {
  id: number;
  normId: number;
  versionCode: string;
  articleRef: string | null;
  validFrom: string;
  validTo: string | null;
  status: string;
  sourceDocument: string | null;
  notes: string | null;
  metadata: unknown;
  createdByUserId: number | null;
  createdAt: string;
}

/** Norma fiscal activa con sus versiones. */
export interface FiscalNorm {
  id: number;
  code: string;
  name: string;
  legalReference: string | null;
  officialSource: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  versions: FiscalNormVersion[];
}

/** Resultado de la sincronización de normas. */
export interface FiscalNormsSyncResult {
  synced: boolean;
  version?: string;
  created?: number;
  superseded?: number;
  message?: string;
}

/* ── Libros types ──────────────────────────────────────────────── */

/** Línea enriquecida del libro de ventas (vista derivada de LibroVentaLine). */
export interface LibroVentaLine {
  id: number;
  opNumber: string;
  issueDate: string;
  customerTaxId: string | null;
  customerName: string | null;
  invoiceNumber: string | null;
  controlNumber: string | null;
  baseExempt: number;
  baseGeneral: number;
  ivaAmount: number;
  totalAmount: number;
  source: 'POS' | 'MANUAL';
  validationErrors: string[];
  validationWarnings: string[];
}

/** Totales agregados del libro de ventas. */
export interface LibroVentasTotals {
  baseExempt: number;
  baseReduced: number;
  baseGeneral: number;
  ivaAmount: number;
  totalAmount: number;
}

/** Respuesta de GET /fiscal/libro-ventas. */
export interface LibroVentasResponse {
  year: number;
  month: number;
  lines: LibroVentaLine[];
  totals: LibroVentasTotals;
}

/** Línea del libro de compras (replica de LibroCompraLine de Prisma). */
export interface LibroCompraLine {
  id: number;
  periodYear: number;
  periodMonth: number;
  expenseId: number | null;
  issueDate: string;
  supplierTaxId: string | null;
  supplierName: string | null;
  invoiceNumber: string | null;
  controlNumber: string | null;
  baseExempt: number;
  baseReduced: number;
  baseGeneral: number;
  ivaAmount: number;
  withholdingIva: number;
  totalAmount: number;
  expense?: { id: number; description: string; amount: number } | null;
}

/** Totales agregados del libro de compras. */
export interface LibroComprasTotals {
  baseExempt: number;
  baseReduced: number;
  baseGeneral: number;
  ivaAmount: number;
  withholdingIva: number;
  totalAmount: number;
}

/** Respuesta de GET /fiscal/libro-compras. */
export interface LibroComprasResponse {
  year: number;
  month: number;
  lines: LibroCompraLine[];
  totals: LibroComprasTotals;
}

/** Parámetros para backfill de libro de ventas (POST /fiscal/backfill/libro-ventas). */
export interface BackfillLibroVentasParams {
  year?: number;
  month?: number;
  limit?: number;
}

/** Respuesta de POST /fiscal/backfill/libro-ventas. */
export interface BackfillLibroVentasResponse {
  scanned: number;
  projected: number;
  recalculated: number;
  skipped: number;
  errors: { invoiceId: number; message: string }[];
}

/* ── Retenciones types ─────────────────────────────────────────── */

/** Retención IVA (replica de RetencionIVA de Prisma con includes). */
export interface RetencionIva {
  id: number;
  organizationId: number;
  expenseId: number;
  periodYear: number;
  periodMonth: number;
  supplierTaxId: string | null;
  supplierName: string | null;
  baseAmount: number;
  ivaAmount: number;
  withholdingRate: number;
  withholdingAmount: number;
  certificateNumber: string | null;
  fiscalDocumentId: number | null;
  createdAt: string;
  updatedAt: string;
  fiscalDocument?: unknown;
  expense?: { id: number; description: string } | null;
}

/* ── Predeclaración types ──────────────────────────────────────── */

/** Paso del asistente de predeclaración. */
export interface PredeclaracionStep {
  id: number;
  title: string;
  done: boolean;
}

/** Datos de predeclaración IVA (GET /fiscal/predeclaracion). */
export interface PredeclaracionData {
  year: number;
  month: number;
  period: { id: number; status: FiscalPeriodStatus; year: number; month: number } | null;
  declaracion: unknown;
  ventas: LibroVentasTotals;
  compras: LibroComprasTotals;
  retencionesCount: number;
  netIvaUsd: number;
  steps: PredeclaracionStep[];
}

/* ── Close period types ────────────────────────────────────────── */

/** Respuesta de POST /fiscal/periods/:year/:month/close. */
export interface ClosePeriodResponse {
  id: number;
  organizationId: number;
  year: number;
  month: number;
  status: FiscalPeriodStatus;
  closedAt: string | null;
  integrityHash: string | null;
}

/* ── Carga rápida compra types ─────────────────────────────────── */

/** Payload para POST /fiscal/compras/carga-rapida (replica de CargaRapidaCompraDto). */
export interface CargaRapidaCompraPayload {
  date: string;
  amount: number;
  description: string;
  categoryId: number;
  supplierId?: number;
  referenceNumber?: string;
  supplierControlNumber?: string;
  baseGeneral?: number;
  ivaAmount?: number;
}

/* ── Service ─────────────────────────────────────────────────────── */

/**
 * Servicio fiscal. Centraliza las llamadas al API de fiscal
 * (/fiscal/profile, /fiscal/dashboard, /fiscal/calendario, /fiscal/compliance,
 * /fiscal/libro-*, /fiscal/retenciones, /fiscal/predeclaracion, /fiscal/periods).
 */
export const fiscalService = {
  /** Obtener el perfil fiscal de la organización actual. */
  getProfile(): Promise<FiscalProfileResponse> {
    return apiClient
      .get<FiscalProfileResponse>('/fiscal/profile')
      .then((res) => res.data);
  },

  /** Crear o actualizar el perfil fiscal de la organización actual. */
  upsertProfile(payload: UpsertFiscalProfilePayload): Promise<FiscalProfileResponse> {
    return apiClient
      .post<FiscalProfileResponse>('/fiscal/profile', payload)
      .then((res) => res.data);
  },

  /** Obtener datos agregados del dashboard fiscal. */
  getDashboard(params?: FiscalPeriodQuery): Promise<FiscalDashboardData> {
    return apiClient
      .get<FiscalDashboardData>('/fiscal/dashboard', { params })
      .then((res) => res.data);
  },

  // ─── Calendario ─────────────────────────────────────────────────

  /** Listar obligaciones del calendario fiscal para un período. */
  listCalendar(params?: FiscalCalendarQuery): Promise<CalendarApiResponse> {
    return apiClient
      .get<CalendarApiResponse>('/fiscal/calendario', { params })
      .then((res) => res.data);
  },

  /** Sincronizar reglas SENIAT y normas desde el JSON oficial. */
  syncCalendario(params?: FiscalCalendarioSyncParams): Promise<FiscalCalendarioSyncResult> {
    return apiClient
      .post<FiscalCalendarioSyncResult>(
        '/fiscal/calendario/sync',
        null,
        { params: params?.force != null ? { force: String(params.force) } : {} },
      )
      .then((res) => res.data);
  },

  // ─── Compliance ─────────────────────────────────────────────────

  /** Obtener hub consolidado de compliance (perfil, calendario, alertas). */
  getComplianceHub(params?: FiscalComplianceQuery): Promise<ComplianceHubApiResponse> {
    return apiClient
      .get<ComplianceHubApiResponse>('/fiscal/compliance/hub', { params })
      .then((res) => res.data);
  },

  /** Validar una operación fiscal de forma preventiva. */
  validateOperation(
    payload: FiscalOperationValidationPayload,
  ): Promise<FiscalOperationValidationResult> {
    return apiClient
      .post<FiscalOperationValidationResult>('/fiscal/compliance/validate', payload)
      .then((res) => res.data);
  },

  /** Emitir un evento de dominio fiscal. */
  emitEvent(payload: FiscalEventPayload): Promise<FiscalEvent | null> {
    return apiClient
      .post<FiscalEvent | null>('/fiscal/compliance/events', payload)
      .then((res) => res.data);
  },

  /** Listar entradas recientes de auditoría fiscal. */
  listAudit(params?: FiscalAuditQuery): Promise<FiscalAuditEntry[]> {
    return apiClient
      .get<FiscalAuditEntry[]>('/fiscal/compliance/audit', { params })
      .then((res) => res.data);
  },

  /** Listar normas SENIAT activas. */
  listNorms(): Promise<FiscalNorm[]> {
    return apiClient
      .get<FiscalNorm[]>('/fiscal/compliance/norms')
      .then((res) => res.data);
  },

  /** Sincronizar normas SENIAT desde el JSON de reglas. */
  syncNorms(): Promise<FiscalNormsSyncResult> {
    return apiClient
      .post<FiscalNormsSyncResult>('/fiscal/compliance/norms/sync')
      .then((res) => res.data);
  },

  // ─── Libros ────────────────────────────────────────────────────

  /** Listar líneas del libro de ventas para un período. */
  listLibroVentas(params?: FiscalPeriodQuery): Promise<LibroVentasResponse> {
    return apiClient
      .get<LibroVentasResponse>('/fiscal/libro-ventas', { params })
      .then((res) => res.data);
  },

  /** Exportar libro de ventas como archivo XLSX (binario). */
  exportLibroVentasXlsx(params: FiscalPeriodQuery): Promise<Blob> {
    return apiClient
      .get('/fiscal/libro-ventas/export.xlsx', { params, responseType: 'blob' })
      .then((res) => res.data as Blob);
  },

  /** Exportar libro de ventas como archivo TXT (binario). */
  exportLibroVentasTxt(params: FiscalPeriodQuery): Promise<Blob> {
    return apiClient
      .get('/fiscal/libro-ventas/export.txt', { params, responseType: 'blob' })
      .then((res) => res.data as Blob);
  },

  /** Listar líneas del libro de compras para un período. */
  listLibroCompras(params?: FiscalPeriodQuery): Promise<LibroComprasResponse> {
    return apiClient
      .get<LibroComprasResponse>('/fiscal/libro-compras', { params })
      .then((res) => res.data);
  },

  /**
   * Backfill de libro de ventas: proyecta facturas históricas sin línea en el libro.
   * Endpoint: POST /fiscal/backfill/libro-ventas (sin body, parámetros en query).
   */
  backfillLibroVentas(params?: BackfillLibroVentasParams): Promise<BackfillLibroVentasResponse> {
    return apiClient
      .post<BackfillLibroVentasResponse>('/fiscal/backfill/libro-ventas', null, { params })
      .then((res) => res.data);
  },

  // ─── Retenciones ──────────────────────────────────────────────

  /** Listar retenciones IVA para un período. */
  listRetenciones(params?: FiscalPeriodQuery): Promise<RetencionIva[]> {
    return apiClient
      .get<RetencionIva[]>('/fiscal/retenciones', { params })
      .then((res) => res.data);
  },

  /** Exportar retenciones IVA como archivo TXT (binario). */
  exportRetencionesTxt(params: FiscalPeriodQuery): Promise<Blob> {
    return apiClient
      .get('/fiscal/retenciones/export.txt', { params, responseType: 'blob' })
      .then((res) => res.data as Blob);
  },

  /** Obtener comprobante de retención IVA en formato PDF (binario). */
  getRetencionPdf(id: number): Promise<Blob> {
    return apiClient
      .get(`/fiscal/retenciones/${id}/pdf`, { responseType: 'blob' })
      .then((res) => res.data as Blob);
  },

  // ─── Predeclaración y cierre ──────────────────────────────────

  /** Obtener datos de predeclaración IVA para un período. */
  getPredeclaracion(params: FiscalPeriodQuery): Promise<PredeclaracionData> {
    return apiClient
      .get<PredeclaracionData>('/fiscal/predeclaracion', { params })
      .then((res) => res.data);
  },

  /** Cerrar período fiscal (POST /fiscal/periods/:year/:month/close). */
  closePeriod(year: number, month: number): Promise<ClosePeriodResponse> {
    return apiClient
      .post<ClosePeriodResponse>(`/fiscal/periods/${year}/${month}/close`)
      .then((res) => res.data);
  },

  /** Carga rápida de compra individual (POST /fiscal/compras/carga-rapida). */
  cargaRapidaCompra(payload: CargaRapidaCompraPayload): Promise<unknown> {
    return apiClient
      .post('/fiscal/compras/carga-rapida', payload)
      .then((res) => res.data);
  },
};

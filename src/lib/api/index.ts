export { apiClient } from './client';
export { default } from './client';

export { invoiceService } from './invoices';
export type {
  HistoryResponse,
  HistoryParams,
  HistoryInvoice,
  DailySummaryItem,
  CreateInvoicePayload,
  CreateInvoiceResponse,
} from './invoices';

export { authService } from './auth';
export type {
  LoginPayload,
  RegisterPayload,
  CompletePasswordResetPayload,
  RecoverPasswordPayload,
  SwitchOrganizationResponse,
} from './auth';

export { concertService } from './concert';
export type {
  AdminSellPayload,
  ConcertEventSetup,
  SyncCatalogResult,
} from './concert';

export {
  hybridService,
  getHybridVentas,
  getHybridVenta,
  getHybridCatalogos,
  getHybridCatalogo,
  getHybridMonedas,
  getHybridErrorMessage,
  formatHybridCliente,
  formatHybridMoney,
  HYBRID_REQUEST_TIMEOUT_MS,
  HYBRID_LIST_TIMEOUT_MS,
  HYBRID_DETAIL_TIMEOUT_MS,
  HYBRID_VENTAS_QUERY_KEYS,
} from './hybrid';
export type {
  HybridVentasParams,
  HybridVentaDetailParams,
  HybridVentaListItem,
  HybridVentaDetalleLine,
  HybridVentaDetail,
  HybridVentasListResult,
  HybridVentasQueryKey,
  HybridCatalogItem,
  HybridCatalogos,
} from './hybrid';

export { fiscalService } from './fiscal';
export type {
  FiscalTaxpayerType,
  FiscalPeriodStatus,
  FiscalProfileOrganization,
  FiscalProfileData,
  FiscalProfileResponse,
  UpsertFiscalProfilePayload,
  FiscalDashboardPeriod,
  FiscalDashboardMetrics,
  FiscalDashboardAgendaItem,
  FiscalDashboardAlert,
  FiscalDashboardProfile,
  FiscalDashboardCalendarioMeta,
  FiscalDashboardComplianceItem,
  FiscalDashboardData,
  FiscalPeriodQuery,
  FiscalDomainEventType,
  ComplianceOperation,
  FiscalCalendarQuery,
  FiscalCalendarioSyncParams,
  FiscalCalendarioSyncResult,
  FiscalComplianceQuery,
  FiscalOperationValidationPayload,
  FiscalOperationValidationResult,
  FiscalEventPayload,
  FiscalEvent,
  FiscalAuditQuery,
  FiscalAuditEntry,
  FiscalNormVersion,
  FiscalNorm,
  FiscalNormsSyncResult,
  LibroVentaLine,
  LibroVentasTotals,
  LibroVentasResponse,
  LibroCompraLine,
  LibroComprasTotals,
  LibroComprasResponse,
  BackfillLibroVentasParams,
  BackfillLibroVentasResponse,
  RetencionIva,
  PredeclaracionStep,
  PredeclaracionData,
  ClosePeriodResponse,
  CargaRapidaCompraPayload,
} from './fiscal';

export { invoiceUploadService } from './invoice-upload';
export type {
  InvoicePreviewLine,
  InvoicePreviewResult,
  InvoiceConfirmLine,
  InvoiceConfirmPayload,
  InvoiceConfirmResult,
  ProductSearchResult,
  InvoiceHistoryItem,
  InvoiceHistoryDetail,
  InvoiceHistoryResponse,
} from './invoice-upload';

export { salesImportService } from './sales-import';
export type {
  SalesImportPreviewResult,
  SalesImportInvoicePreview,
  SalesImportConfirmPayload,
  SalesImportConfirmResult,
  SalesImportProvisionResult,
  SalesImportInvoiceStatus,
} from './sales-import';

export { variantService } from './product-variants';
export type {
  ProductVariant,
  CreateVariantPayload,
  UpdateVariantPayload,
} from './product-variants';

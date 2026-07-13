import { apiClient } from './client';

export type SalesImportInvoiceStatus =
  | 'ready'
  | 'warning'
  | 'error'
  | 'already_imported';

export interface SalesImportLinePreview {
  productCode: string;
  description: string;
  quantity: number;
  lineTotal: number;
  productId?: number;
  productName?: string;
  matchBy?: 'sku' | 'barcode' | 'name';
}

export interface SalesImportInvoicePreview {
  legacyKey: string;
  saleDate: string;
  customer: string;
  lineCount: number;
  excelTotal: number;
  computedTotal: number;
  totalsMatch: boolean;
  status: SalesImportInvoiceStatus;
  issues: string[];
  lines: SalesImportLinePreview[];
}

export interface SalesImportPreviewResult {
  batchId: string;
  organizationId: number;
  summary: {
    files: number;
    invoices: number;
    lines: number;
    ready: number;
    warnings: number;
    errors: number;
    alreadyImported: number;
  };
  invoices: SalesImportInvoicePreview[];
}

export interface SalesImportConfirmPayload {
  batchId: string;
  allowWarnings?: boolean;
  skipStockValidation?: boolean;
}

export interface SalesImportConfirmResult {
  imported: number;
  failed: number;
  invoices: { legacyKey: string; invoiceId: number }[];
  errors: { legacyKey: string; error: string }[];
}

export interface SalesImportProvisionResult {
  created: number;
  skipped: number;
  products: string[];
}

function appendFiles(formData: FormData, files: File[]) {
  for (const file of files) {
    formData.append('files', file);
  }
}

export const salesImportService = {
  preview(files: File[]): Promise<SalesImportPreviewResult> {
    const formData = new FormData();
    appendFiles(formData, files);
    return apiClient
      .post<SalesImportPreviewResult>('/sales-import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },

  provisionMissing(files: File[]): Promise<SalesImportProvisionResult> {
    const formData = new FormData();
    appendFiles(formData, files);
    return apiClient
      .post<SalesImportProvisionResult>('/sales-import/provision-missing', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },

  confirm(payload: SalesImportConfirmPayload): Promise<SalesImportConfirmResult> {
    return apiClient
      .post<SalesImportConfirmResult>('/sales-import/confirm', payload)
      .then((res) => res.data);
  },
};

import { apiClient } from './client';

export interface PurchasesImportLinePreview {
  rowNum: number;
  sku: string;
  description: string;
  quantity: number;
  unitCostUsd: number;
  salePriceUsd: number;
  productId: number | null;
  productName: string | null;
  matchMethod: string;
  willCreate: boolean;
}

export interface PurchasesImportGroupPreview {
  groupIndex: number;
  purchaseDate: string;
  invoiceRef: string;
  supplierName: string;
  totalUsd: number;
  lines: PurchasesImportLinePreview[];
  alreadyImported: boolean;
}

export interface PurchasesImportPreviewResult {
  organizationId: number;
  fileName: string;
  groups: PurchasesImportGroupPreview[];
  totalLines: number;
  totalAmountUsd: number;
  productsToCreate: number;
  suppliersToCreate: string[];
}

export interface PurchasesImportConfirmResult {
  fileName: string;
  expensesCreated: number;
  expensesSkipped: number;
  productsCreated: number;
  movementsCreated: number;
  stockAdded: number;
  totalAmountUsd: number;
  groups: number;
}

export const purchasesImportService = {
  preview(file: File): Promise<PurchasesImportPreviewResult> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post<PurchasesImportPreviewResult>('/purchases-import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },

  confirm(file: File, skipImported = true): Promise<PurchasesImportConfirmResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('skipImported', String(skipImported));
    return apiClient
      .post<PurchasesImportConfirmResult>('/purchases-import/confirm', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
};

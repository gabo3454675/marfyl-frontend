import apiClient from './client';

export type ScannedReceiptLine = {
  name: string;
  quantity: number;
  unit: string | null;
  unitCostUsd: number | null;
  lineTotalUsd: number | null;
  matchedProductId: number | null;
  matchedProductName: string | null;
  action: 'match' | 'create';
};

export type ScannedReceiptResult = {
  vendorName: string | null;
  vendorTaxId: string | null;
  documentNumber: string | null;
  issueDate: string | null;
  condition: string | null;
  totalUsd: number | null;
  totalBs: number | null;
  referenceFactor: number | null;
  lines: ScannedReceiptLine[];
  warnings: string[];
};

export const receiptScanService = {
  async scan(file: File): Promise<ScannedReceiptResult> {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post<ScannedReceiptResult>('/expenses/scan-receipt', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async confirm(payload: {
    mode: 'inventory' | 'expense';
    scan: ScannedReceiptResult;
    categoryId: number;
    supplierId?: number;
    status?: 'PAID' | 'PENDING';
  }) {
    const res = await apiClient.post('/expenses/scan-receipt/confirm', payload);
    return res.data;
  },
};

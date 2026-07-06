import { apiClient } from './client';

export interface InvoicePreviewLine {
  lineIndex: number;
  originalCode: string;
  originalName: string;
  quantity: number;
  unitCost: number;
  productId: number | null;
  productName: string | null;
  productSku: string | null;
  salePrice: number | null;
  currentStock: number | null;
  currentCostPrice: number | null;
  matchType: 'sku' | 'barcode' | 'name_exact' | 'name_fuzzy' | null;
  matchConfidence: number;
  status: 'matched' | 'unmatched' | 'error';
  error?: string;
  lineTotal: number;
}

export interface InvoicePreviewResult {
  dryRun: true;
  fileName: string;
  fileType: 'excel' | 'pdf';
  totalLines: number;
  matchedLines: number;
  unmatchedLines: number;
  totalAmount: number;
  lines: InvoicePreviewLine[];
  errors: Array<{ row?: number; line?: number; message: string }>;
  unmatched: Array<{ row?: number; line?: number; code: string; reason: string }>;
  canConfirm: boolean;
}

export interface InvoiceConfirmLine {
  productId: number;
  quantity: number;
  unitCostUsd?: number;
  originalName?: string;
}

export interface InvoiceConfirmPayload {
  lines: InvoiceConfirmLine[];
  supplierId?: number;
  date?: string;
  referenceNumber?: string;
  description?: string;
  createExpense?: boolean;
  initialPayment?: number;
}

export interface InvoiceConfirmResult {
  dryRun: false;
  movementsCreated: number;
  productsUpdated: number;
  expenseId: number | null;
  totalAmount: number;
  lines: Array<{
    productId: number;
    productName: string;
    quantityAdded: number;
    newStock: number;
    unitCost: number;
  }>;
}

export interface ProductSearchResult {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  isBundle: boolean;
  isService: boolean;
}

export interface InvoiceHistoryItem {
  id: number;
  date: string;
  amount: number;
  description: string;
  referenceNumber: string | null;
  status: string;
  supplier: { id: number; name: string } | null;
  createdAt: string;
}

export interface InvoiceHistoryDetail {
  id: number;
  date: string;
  amount: number;
  description: string;
  referenceNumber: string | null;
  status: string;
  supplier: { id: number; name: string; taxId?: string | null; email?: string | null; phone?: string | null } | null;
  category: { id: number; name: string } | null;
  baseExempt: number;
  baseReduced: number;
  baseGeneral: number;
  ivaAmount: number;
  supplierControlNumber: string | null;
  supplierInvoiceNumber: string | null;
  payments: { id: number; amount: number; paidAt: string; notes: string | null }[];
  amountPaid: number;
  products: { productId: number; productName: string; productSku: string | null; quantity: number; unitCost: number | null; total: number | null }[];
  createdAt: string;
}

export interface InvoiceHistoryResponse {
  items: InvoiceHistoryItem[];
  total: number;
  page: number;
  pages: number;
}

export const invoiceUploadService = {
  preview(file: File, supplierId?: number): Promise<InvoicePreviewResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (supplierId) formData.append('supplierId', String(supplierId));
    return apiClient.post<InvoicePreviewResult>('/invoice-upload/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data);
  },

  confirm(payload: InvoiceConfirmPayload): Promise<InvoiceConfirmResult> {
    return apiClient.post<InvoiceConfirmResult>('/invoice-upload/confirm', payload)
      .then((res) => res.data);
  },

  searchProducts(query: string, limit = 20): Promise<ProductSearchResult[]> {
    return apiClient.get<ProductSearchResult[]>('/invoice-upload/products/search', {
      params: { q: query, limit },
    }).then((res) => res.data);
  },

  getHistory(params?: { page?: number; limit?: number; dateFrom?: string; dateTo?: string }): Promise<InvoiceHistoryResponse> {
    return apiClient.get<InvoiceHistoryResponse>('/invoice-upload/history', { params })
      .then((res) => res.data);
  },

  getHistoryDetail(id: number): Promise<InvoiceHistoryDetail> {
    return apiClient.get<InvoiceHistoryDetail>(`/invoice-upload/history/${id}`).then((res) => res.data);
  },
};

import { apiClient } from './client';

export interface InventoryMovement {
  id: number;
  type: 'VENTA' | 'COMPRA' | 'AUTOCONSUMO' | 'MERMA_VENCIDO' | 'MERMA_DANADO' | 'USO_TALLER';
  quantity: number;
  reason?: string | null;
  productId: number;
  userId: number;
  tenantId: number;
  unitCostAtTransaction?: number | string | null;
  consumptionReason?: 'MERMA' | 'MUESTRAS' | 'USO_OPERATIVO' | null;
  createdAt: string;
  updatedAt?: string;
  product?: { id: number; name: string; sku?: string | null };
  user?: { id: number; fullName?: string | null; email: string };
}

export interface CreateMovementPayload {
  type: 'VENTA' | 'COMPRA' | 'AUTOCONSUMO' | 'MERMA_VENCIDO' | 'MERMA_DANADO' | 'USO_TALLER';
  quantity: number;
  reason?: string;
  productId: number;
  consumptionReason?: 'MERMA' | 'MUESTRAS' | 'USO_OPERATIVO';
}

export interface AutoconsumoKpis {
  totalAutoconsumo: number;
  totalMerma: number;
  byReason: { reason: string; count: number; totalValue: number }[];
  byProduct: { productId: number; productName: string; totalQuantity: number; totalValue: number }[];
  dailyTrend: { date: string; autoconsumo: number; merma: number }[];
}

export interface InventoryImportPreviewRow {
  rowNumber: number;
  sku: string;
  name: string;
  costPrice: number;
  salePrice: number;
  profit: number;
  stock: number;
  description: string | null;
  isExempt: boolean;
  action: 'create' | 'update' | 'skip';
}

export interface InventoryImportError {
  row: number;
  field?: string;
  message: string;
}

export interface InventoryImportPreviewResult {
  confirm: false;
  preview: InventoryImportPreviewRow[];
  errors: InventoryImportError[];
  summary: { toCreate: number; toUpdate: number };
}

export interface InventoryImportConfirmResult {
  confirm: true;
  created: number;
  updated: number;
  summary: { toCreate: number; toUpdate: number };
}

function buildImportFormData(file: File, confirm: boolean): FormData {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('confirm', confirm ? 'true' : 'false');
  return fd;
}

export const inventoryService = {
  getMovements(params?: { productId?: number; type?: string; limit?: number }): Promise<InventoryMovement[]> {
    return apiClient.get<InventoryMovement[]>('/inventory/movements', { params }).then((res) => res.data);
  },
  createMovement(payload: CreateMovementPayload): Promise<InventoryMovement> {
    return apiClient.post<InventoryMovement>('/inventory/movements', payload).then((res) => res.data);
  },
  getKpis(params?: { dateFrom?: string; dateTo?: string }): Promise<AutoconsumoKpis> {
    return apiClient.get<AutoconsumoKpis>('/inventory/movements/kpis', { params }).then((res) => res.data);
  },

  previewImport(file: File): Promise<InventoryImportPreviewResult> {
    return apiClient
      .post<InventoryImportPreviewResult>('/inventory/import', buildImportFormData(file, false), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },

  confirmImport(file: File): Promise<InventoryImportConfirmResult> {
    return apiClient
      .post<InventoryImportConfirmResult>('/inventory/import', buildImportFormData(file, true), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
};

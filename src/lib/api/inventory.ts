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
};

import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  salePrice: number;
  unitQuantity: number;
  stockBehavior: 'DEDUCT' | 'NO_DEDUCT';
  inheritCost: boolean;
  customCost: number | null;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVariantPayload {
  name: string;
  salePrice: number;
  unitQuantity?: number;
  stockBehavior?: 'DEDUCT' | 'NO_DEDUCT';
  inheritCost?: boolean;
  customCost?: number;
  isDefault?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateVariantPayload = Partial<CreateVariantPayload>;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const variantService = {
  /** Obtiene todas las variantes de un producto */
  getByProduct(productId: number): Promise<ProductVariant[]> {
    return apiClient
      .get<ProductVariant[]>(`/products/${productId}/variants`)
      .then((res) => res.data);
  },

  /** Crea una nueva variante para un producto */
  create(productId: number, payload: CreateVariantPayload): Promise<ProductVariant> {
    return apiClient
      .post<ProductVariant>(`/products/${productId}/variants`, payload)
      .then((res) => res.data);
  },

  /** Actualiza una variante existente */
  update(variantId: number, payload: UpdateVariantPayload): Promise<ProductVariant> {
    return apiClient
      .patch<ProductVariant>(`/variants/${variantId}`, payload)
      .then((res) => res.data);
  },

  /** Elimina una variante */
  delete(variantId: number): Promise<{ success: boolean }> {
    return apiClient
      .delete<{ success: boolean }>(`/variants/${variantId}`)
      .then((res) => res.data);
  },
};

import { apiClient } from './client';
import type { ProductVariant, CreateVariantPayload, UpdateVariantPayload } from '@/types/product-variant';

/**
 * Servicio de variantes de producto.
 * Endpoints: /products/:productId/variants
 */
export const variantService = {
  /** Obtener todas las variantes de un producto */
  getAll(productId: number): Promise<ProductVariant[]> {
    return apiClient
      .get<ProductVariant[]>(`/products/${productId}/variants`)
      .then((res) => res.data);
  },

  /** Crear una variante */
  create(productId: number, payload: CreateVariantPayload): Promise<ProductVariant> {
    return apiClient
      .post<ProductVariant>(`/products/${productId}/variants`, payload)
      .then((res) => res.data);
  },

  /** Actualizar una variante */
  update(productId: number, payload: UpdateVariantPayload): Promise<ProductVariant> {
    const { id, ...data } = payload;
    return apiClient
      .patch<ProductVariant>(`/products/${productId}/variants/${id}`, data)
      .then((res) => res.data);
  },

  /** Eliminar una variante */
  remove(productId: number, variantId: number): Promise<void> {
    return apiClient
      .delete(`/products/${productId}/variants/${variantId}`)
      .then(() => undefined);
  },

  /** Reordenar variantes — envía array de { id, sortOrder } */
  reorder(
    productId: number,
    orderedIds: Array<{ id: number; sortOrder: number }>
  ): Promise<ProductVariant[]> {
    return apiClient
      .patch<ProductVariant[]>(`/products/${productId}/variants/reorder`, {
        variants: orderedIds,
      })
      .then((res) => res.data);
  },
};

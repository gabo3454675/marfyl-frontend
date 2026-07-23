/**
 * Variante de producto — talla, empaque o presentación distinta.
 * Alineado con el schema Prisma del backend.
 */
export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  salePrice: number;
  unitQuantity: number;
  stockBehavior: 'DEDUCT' | 'NO_DEDUCT';
  inheritCost: boolean;
  /** Solo aplica cuando inheritCost = false */
  costPrice: number | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateVariantPayload {
  name: string;
  salePrice: number;
  unitQuantity?: number;
  stockBehavior?: 'DEDUCT' | 'NO_DEDUCT';
  inheritCost?: boolean;
  costPrice?: number | null;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateVariantPayload extends Partial<CreateVariantPayload> {
  id: number;
}

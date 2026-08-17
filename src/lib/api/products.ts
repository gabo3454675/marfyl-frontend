import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/pagination';

export interface Product {
  id: number;
  companyId?: number;
  organizationId?: number | null;
  name: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  costPrice: number | string;
  salePrice: number | string;
  salePriceCurrency?: string;
  stock: number;
  reservedStock?: number;
  availableStock?: number;
  imageUrl?: string | null;
  minStock?: number;
  isExempt?: boolean;
  isBundle?: boolean;
  isService?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  costPrice?: number;
  salePrice?: number;
  salePriceCurrency?: string;
  stock?: number;
  minStock?: number;
  isExempt?: boolean;
  isBundle?: boolean;
  isService?: boolean;
  bundleComponents?: { productId: number; quantity: number }[] | null;
}

export interface LowStockProduct {
  id: number;
  sku?: string | null;
  name: string;
  stock: number;
  minStock: number;
  updatedAt?: string;
}

export type BomLineView = {
  productId: number;
  name: string;
  sku: string | null;
  quantity: number;
  availableStock: number;
  missing: boolean;
  inactive: boolean;
};

export type BomComboView = {
  id: number;
  name: string;
  salePrice: number;
  recipeOk: boolean;
  buildable: number;
  bottleneck: { productId: number; name: string; availableStock: number } | null;
  lines: BomLineView[];
};

export type BomOverview = {
  combos: BomComboView[];
  blockedBy: {
    productId: number;
    name: string;
    availableStock: number;
    comboIds: number[];
    comboNames: string[];
  }[];
};

export type ComboWorkspaceItem = {
  id: number;
  name: string;
  sku?: string | null;
  salePrice: number;
  isBundle: boolean;
  isService: boolean;
  isActive?: boolean;
  bundleComponents?: unknown;
};

export type ComboWorkspace = {
  combos: ComboWorkspaceItem[];
  services: ComboWorkspaceItem[];
  recipeCatalog: { id: number; name: string; sku?: string | null; isBundle?: boolean }[];
};

export const productService = {
  getPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);

    const queryString = searchParams.toString();
    const url = `/products${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<PaginatedResponse<Product>>(url).then((res) => res.data);
  },
  getAll(): Promise<Product[]> {
    return apiClient.get<Product[]>('/products').then((res) => res.data);
  },
  getById(id: number): Promise<Product> {
    return apiClient.get<Product>(`/products/${id}`).then((res) => res.data);
  },
  getByBarcode(barcode: string): Promise<Product> {
    return apiClient.get<Product>(`/products/barcode/${barcode}`).then((res) => res.data);
  },
  getAlertasStock(): Promise<LowStockProduct[]> {
    return apiClient.get<LowStockProduct[]>('/products/alertas-stock').then((res) => res.data);
  },
  getBom(): Promise<BomOverview> {
    return apiClient
      .get<BomOverview>('/products/bom', { timeout: 45_000 })
      .then((res) => res.data);
  },
  getComboWorkspace(): Promise<ComboWorkspace> {
    return apiClient
      .get<ComboWorkspace>('/products/combo-workspace', { timeout: 45_000 })
      .then((res) => res.data);
  },
  create(payload: CreateProductPayload): Promise<Product> {
    return apiClient.post<Product>('/products', payload).then((res) => res.data);
  },
  update(id: number, payload: Partial<CreateProductPayload>): Promise<Product> {
    return apiClient.patch<Product>(`/products/${id}`, payload).then((res) => res.data);
  },
  remove(id: number): Promise<void> {
    return apiClient.delete(`/products/${id}`).then(() => undefined);
  },
  importExcel(file: File): Promise<{ imported: number; errors?: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ imported: number; errors?: string[] }>('/products/upload-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data);
  },
};

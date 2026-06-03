import { apiClient } from './client';

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
}

export interface LowStockProduct {
  id: number;
  sku?: string | null;
  name: string;
  stock: number;
  minStock: number;
  updatedAt?: string;
}

export const productService = {
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

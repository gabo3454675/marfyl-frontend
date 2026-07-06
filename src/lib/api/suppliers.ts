import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/pagination';

export interface Supplier {
  id: number;
  companyId?: number;
  organizationId?: number | null;
  name: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSupplierPayload {
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const supplierService = {
  getPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<Supplier>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);

    const queryString = searchParams.toString();
    const url = `/suppliers${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<PaginatedResponse<Supplier>>(url).then((res) => res.data);
  },
  getAll(): Promise<Supplier[]> {
    return apiClient.get<Supplier[]>('/suppliers').then((res) => res.data);
  },
  getById(id: number): Promise<Supplier> {
    return apiClient.get<Supplier>(`/suppliers/${id}`).then((res) => res.data);
  },
  create(payload: CreateSupplierPayload): Promise<Supplier> {
    return apiClient.post<Supplier>('/suppliers', payload).then((res) => res.data);
  },
  update(id: number, payload: Partial<CreateSupplierPayload>): Promise<Supplier> {
    return apiClient.patch<Supplier>(`/suppliers/${id}`, payload).then((res) => res.data);
  },
  remove(id: number): Promise<void> {
    return apiClient.delete(`/suppliers/${id}`).then(() => undefined);
  },
};

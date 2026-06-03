import { apiClient } from './client';

export interface Customer {
  id: number;
  companyId?: number;
  organizationId?: number | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCustomerPayload {
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const customerService = {
  getAll(): Promise<Customer[]> {
    return apiClient.get<Customer[]>('/customers').then((res) => res.data);
  },
  getById(id: number): Promise<Customer> {
    return apiClient.get<Customer>(`/customers/${id}`).then((res) => res.data);
  },
  create(payload: CreateCustomerPayload): Promise<Customer> {
    return apiClient.post<Customer>('/customers', payload).then((res) => res.data);
  },
  update(id: number, payload: Partial<CreateCustomerPayload>): Promise<Customer> {
    return apiClient.patch<Customer>(`/customers/${id}`, payload).then((res) => res.data);
  },
  remove(id: number): Promise<void> {
    return apiClient.delete(`/customers/${id}`).then(() => undefined);
  },
};

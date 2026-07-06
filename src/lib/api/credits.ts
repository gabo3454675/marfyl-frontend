import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/pagination';

export interface CustomerCredit {
  id: number;
  customerId: number;
  organizationId: number;
  limitAmount: number | string;
  currentBalance: number | string;
  status: 'ACTIVE' | 'SUSPENDED';
  creditDueDays: number;
  createdAt: string;
  updatedAt?: string;
  customer?: { id: number; name: string; taxId?: string | null };
  transactions?: CreditTransaction[];
}

export interface CreditTransaction {
  id: number;
  creditId: number;
  invoiceId?: number | null;
  type: 'CHARGE' | 'PAYMENT';
  amountUsd: number | string;
  amountBs: number | string;
  exchangeRate: number | string;
  description?: string | null;
  createdAt: string;
}

export const creditService = {
  getPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<CustomerCredit>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);

    const queryString = searchParams.toString();
    const url = `/credits${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<PaginatedResponse<CustomerCredit>>(url).then((res) => res.data);
  },
  getAll(): Promise<CustomerCredit[]> {
    return apiClient.get<CustomerCredit[]>('/credits').then((res) => res.data);
  },
  getOverdueCustomerIds(): Promise<{ customerIds: number[] }> {
    return apiClient.get<{ customerIds: number[] }>('/credits/overdue-customer-ids').then((res) => res.data);
  },
  getByCustomer(customerId: number): Promise<CustomerCredit> {
    return apiClient.get<CustomerCredit>(`/credits/customer/${customerId}`).then((res) => res.data);
  },
  updateLimit(creditId: number, payload: { limitAmount: number }): Promise<CustomerCredit> {
    return apiClient.patch<CustomerCredit>(`/credits/${creditId}/limit`, payload).then((res) => res.data);
  },
  registerPayment(creditId: number, payload: { amountUsd: number; amountBs: number; exchangeRate: number; invoiceId?: number; description?: string }): Promise<CreditTransaction> {
    return apiClient.post<CreditTransaction>(`/credits/${creditId}/payment`, payload).then((res) => res.data);
  },
  getTransactions(creditId: number): Promise<CreditTransaction[]> {
    return apiClient.get<CreditTransaction[]>(`/credits/${creditId}/transactions`).then((res) => res.data);
  },
};

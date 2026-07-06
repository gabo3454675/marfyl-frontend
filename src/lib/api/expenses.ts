import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/pagination';

export interface Expense {
  id: number;
  companyId?: number;
  organizationId?: number | null;
  date: string;
  amount: number | string;
  description: string;
  referenceNumber?: string | null;
  status: 'PENDING' | 'PAID';
  supplierId?: number | null;
  categoryId: number;
  baseExempt?: number | string;
  baseReduced?: number | string;
  baseGeneral?: number | string;
  ivaAmount?: number | string;
  supplierControlNumber?: string | null;
  supplierInvoiceNumber?: string | null;
  createdAt: string;
  updatedAt?: string;
  supplier?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
  payments?: ExpensePayment[];
}

export interface ExpensePayment {
  id: number;
  amount: number | string;
  paidAt: string;
  notes?: string | null;
}

export interface CreateExpensePayload {
  date: string;
  amount: number;
  description: string;
  referenceNumber?: string;
  status?: 'PENDING' | 'PAID';
  supplierId?: number;
  categoryId: number;
  supplierControlNumber?: string;
  supplierInvoiceNumber?: string;
  baseGeneral?: number;
  ivaAmount?: number;
  baseExempt?: number;
  initialPayment?: { amount: number; notes?: string };
}

export interface ExpenseStats {
  totalExpenses: number;
  byCategory: { categoryId: number; categoryName: string; total: number }[];
  byMonth: { month: string; total: number }[];
}

export interface AccountsPayable {
  id: number;
  supplierName: string;
  totalPending: number;
  expenses: { id: number; amount: number; description: string; date: string }[];
}

export const expenseService = {
  getPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<Expense>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);

    const queryString = searchParams.toString();
    const url = `/expenses${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<PaginatedResponse<Expense>>(url).then((res) => res.data);
  },
  getAll(): Promise<Expense[]> {
    return apiClient.get<Expense[]>('/expenses').then((res) => res.data);
  },
  getById(id: number): Promise<Expense> {
    return apiClient.get<Expense>(`/expenses/${id}`).then((res) => res.data);
  },
  getStats(): Promise<ExpenseStats> {
    return apiClient.get<ExpenseStats>('/expenses/stats').then((res) => res.data);
  },
  getAccountsPayable(): Promise<AccountsPayable[]> {
    return apiClient.get<AccountsPayable[]>('/expenses/accounts-payable').then((res) => res.data);
  },
  create(payload: CreateExpensePayload): Promise<Expense> {
    return apiClient.post<Expense>('/expenses', payload).then((res) => res.data);
  },
  update(id: number, payload: Partial<CreateExpensePayload>): Promise<Expense> {
    return apiClient.patch<Expense>(`/expenses/${id}`, payload).then((res) => res.data);
  },
  remove(id: number): Promise<void> {
    return apiClient.delete(`/expenses/${id}`).then(() => undefined);
  },
  registerPayment(expenseId: number, payload: { amount: number; notes?: string }): Promise<ExpensePayment> {
    return apiClient.post<ExpensePayment>(`/expenses/${expenseId}/payments`, payload).then((res) => res.data);
  },
  importPurchase(file: File, metadata: { confirm?: boolean; supplierId?: number; date?: string; referenceNumber?: string; description?: string; initialPayment?: number }): Promise<{ imported: number; errors?: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.confirm) formData.append('confirm', 'true');
    if (metadata.supplierId) formData.append('supplierId', String(metadata.supplierId));
    if (metadata.date) formData.append('date', metadata.date);
    if (metadata.referenceNumber) formData.append('referenceNumber', metadata.referenceNumber);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.initialPayment) formData.append('initialPayment', String(metadata.initialPayment));
    return apiClient.post<{ imported: number; errors?: string[] }>('/expenses/import-purchase', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data);
  },
};

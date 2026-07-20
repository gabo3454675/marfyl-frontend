import { apiClient } from '@/lib/api';

export type CashHoldLocation = 'OFFICE' | 'STORE';

export type CashHold = {
  id: number;
  organizationId: number;
  location: CashHoldLocation;
  currency: string;
  amount: string | number;
  asOf: string;
  label: string;
  notes: string | null;
  importKey: string | null;
  createdAt: string;
};

export type UpsertCashHoldPayload = {
  location: CashHoldLocation;
  currency: string;
  amount: number;
  asOf: string;
  label: string;
  notes?: string;
  importKey?: string;
};

export const cashHoldsApi = {
  list: () => apiClient.get<CashHold[]>('/cash-holds').then((r) => r.data),
  summary: () =>
    apiClient
      .get<{ location: string; currency: string; amount: number }[]>('/cash-holds/summary')
      .then((r) => r.data),
  upsert: (payload: UpsertCashHoldPayload) =>
    apiClient.post<CashHold>('/cash-holds', payload).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/cash-holds/${id}`).then((r) => r.data),
};

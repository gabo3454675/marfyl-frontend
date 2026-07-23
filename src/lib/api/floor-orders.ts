import { apiClient } from '@/lib/api';

export type FloorOrderStatus =
  | 'DRAFT'
  | 'SENT'
  | 'IN_PREP'
  | 'READY'
  | 'CHARGED'
  | 'CANCELLED';

export type FloorStation = 'BAR' | 'KITCHEN' | 'OTHER';

export type FloorPaymentMode = 'INMEDIATO' | 'CUENTA_ABIERTA';

export type FloorOrderItem = {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number | string;
  notes?: string | null;
  station: FloorStation;
  product?: {
    id: number;
    name: string;
    sku?: string | null;
    imageUrl?: string | null;
    stock?: number;
    reservedStock?: number;
    salePrice?: number | string;
  };
};

export type FloorOrder = {
  id: number;
  organizationId: number;
  tableLabel: string;
  zone?: string | null;
  customerName?: string | null;
  customerId?: number | null;
  status: FloorOrderStatus;
  paymentMode: FloorPaymentMode;
  isOpen: boolean;
  notes?: string | null;
  createdAt: string;
  sentAt?: string | null;
  chargedAt?: string | null;
  chargedInvoiceId?: number | null;
  items: FloorOrderItem[];
  createdBy?: { id: number; fullName?: string | null };
};

export type FloorTable = {
  id: number;
  label: string;
  zone: string;
  capacity?: number | null;
  accountId: number | null;
  status: 'FREE' | 'OCCUPIED';
  totalUsd: number;
  paidUsd: number;
  balanceUsd: number;
  ordersCount: number;
};

export type CreateFloorOrderPayload = {
  tableId?: number;
  tableLabel: string;
  zone?: string;
  customerName?: string;
  customerId?: number;
  notes?: string;
  items: { productId: number; quantity: number; notes?: string }[];
  sendNow?: boolean;
  paymentMode?: FloorPaymentMode;
  customerTaxId?: string;
  customerPhone?: string;
  customerFirstName?: string;
  customerLastName?: string;
};

export type ChargeFloorOrderPayload = {
  customerId?: number;
  paymentMethod?: string;
  payments?: { method: string; amount: number; currency: string }[];
  notes?: string;
};

export type OpenTabCustomer = {
  customerId: number;
  customerName: string;
  totalUsd: number;
  ordersCount: number;
  orders: FloorOrder[];
};

export type CustomerLookupResult = {
  id: number;
  name: string;
  taxId: string | null;
  phone: string | null;
  email: string | null;
} | null;

export type QuickRegisterPayload = {
  taxId: string;
  phone: string;
  firstName: string;
  lastName: string;
};

export type ChargeCustomerOpenTabPayload = {
  paymentMethod?: string;
  payments?: { method: string; amount: number; currency: string }[];
  notes?: string;
};

export type FloorOrderHistoryUser = {
  userId: number;
  fullName: string;
  orders: number;
  totalUsd: number;
};

export type FloorOrderHistoryLine = {
  id: number;
  tableLabel: string;
  customerName?: string | null;
  status: FloorOrderStatus;
  notes?: string | null;
  createdAt: string;
  sentAt?: string | null;
  chargedAt?: string | null;
  chargedInvoiceId?: number | null;
  invoiceConsecutive?: number | null;
  totalUsd: number;
  createdBy: { id: number; fullName?: string | null };
  items: {
    id: number;
    productId: number;
    name: string;
    quantity: number;
    unitPrice: number;
    station: FloorStation;
  }[];
};

export type FloorOrderHistoryResponse = {
  from: string;
  to: string;
  seeAll: boolean;
  scopedToUserId: number | null;
  summary: {
    orders: number;
    totalUsd: number;
    byUser: FloorOrderHistoryUser[];
  };
  orders: FloorOrderHistoryLine[];
};

export const floorOrdersApi = {
  listTables: () =>
    apiClient.get<FloorTable[]>('/floor-orders/tables').then((r) => r.data),
  createTable: (payload: { label: string; zone?: string }) =>
    apiClient.post<FloorTable>('/floor-orders/tables', payload).then((r) => r.data),
  recordTablePayment: (
    accountId: number,
    payload: { amount: number; method: string; currency?: string; notes?: string },
  ) =>
    apiClient
      .post(`/floor-orders/tables/accounts/${accountId}/payments`, payload)
      .then((r) => r.data),
  closeTableAccount: (
    accountId: number,
    payload: { payments: { method: string; amount: number; currency: string }[]; notes?: string },
  ) =>
    apiClient
      .post(`/floor-orders/tables/accounts/${accountId}/close`, payload)
      .then((r) => r.data),
  list: (params?: { status?: string; day?: string; station?: string }) =>
    apiClient
      .get<FloorOrder[]>('/floor-orders', { params })
      .then((r) => r.data),

  pendingByUser: (params?: { day?: string }) =>
    apiClient
      .get<
        {
          userId: number;
          fullName: string;
          taken: number;
          pending: number;
          sent: number;
          inPrep: number;
          ready: number;
          charged: number;
          cancelled: number;
          totalTakenUsd: number;
          chargedUsd: number;
          pendingUsd: number;
        }[]
      >('/floor-orders/stats/by-user', { params })
      .then((r) => r.data),

  history: (params?: {
    month?: string;
    from?: string;
    to?: string;
    createdById?: number;
  }) =>
    apiClient
      .get<FloorOrderHistoryResponse>('/floor-orders/history', { params })
      .then((r) => r.data),

  getOne: (id: number) =>
    apiClient.get<FloorOrder>(`/floor-orders/${id}`).then((r) => r.data),

  create: (payload: CreateFloorOrderPayload) =>
    apiClient.post<FloorOrder>('/floor-orders', payload).then((r) => r.data),

  send: (id: number) =>
    apiClient.post<FloorOrder>(`/floor-orders/${id}/send`).then((r) => r.data),

  updateStatus: (id: number, status: 'IN_PREP' | 'READY') =>
    apiClient
      .patch<FloorOrder>(`/floor-orders/${id}/status`, { status })
      .then((r) => r.data),

  charge: (id: number, payload: ChargeFloorOrderPayload) =>
    apiClient
      .post<{ order: FloorOrder; invoice: unknown }>(
        `/floor-orders/${id}/charge`,
        payload,
      )
      .then((r) => r.data),

  cancel: (id: number) =>
    apiClient
      .post<FloorOrder>(`/floor-orders/${id}/cancel`)
      .then((r) => r.data),

  findCustomerByTaxId: (taxId: string) =>
    apiClient
      .get<CustomerLookupResult>(`/floor-orders/customer-by-taxid/${encodeURIComponent(taxId)}`)
      .then((r) => r.data),

  quickRegisterCustomer: (payload: QuickRegisterPayload) =>
    apiClient
      .post<{ id: number; name: string; taxId: string; phone: string }>(
        '/floor-orders/quick-register-customer',
        payload,
      )
      .then((r) => r.data),

  getOpenTabs: () =>
    apiClient
      .get<OpenTabCustomer[]>('/floor-orders/open-tabs')
      .then((r) => r.data),

  getCustomerOpenOrders: (customerId: number) =>
    apiClient
      .get<{ customerId: number; totalUsd: number; ordersCount: number; orders: FloorOrder[] }>(
        `/floor-orders/open-by-customer/${customerId}`,
      )
      .then((r) => r.data),

  chargeCustomerOpenTab: (customerId: number, payload: ChargeCustomerOpenTabPayload) =>
    apiClient
      .post<{ orders: FloorOrder[]; invoice: unknown }>(
        `/floor-orders/charge-customer/${customerId}`,
        payload,
      )
      .then((r) => r.data),
};

export function floorOrderTotal(order: FloorOrder): number {
  return order.items.reduce(
    (s, i) => s + Number(i.unitPrice) * i.quantity,
    0,
  );
}

export function floorOrderStatusLabel(status: FloorOrderStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Borrador';
    case 'SENT':
      return 'Enviado';
    case 'IN_PREP':
      return 'Preparando';
    case 'READY':
      return 'Lista · cobro';
    case 'CHARGED':
      return 'Cobrada';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status;
  }
}

export function floorOrderDestLabel(order: FloorOrder): string {
  const stations = new Set(order.items.map((i) => i.station));
  const hasBar = stations.has('BAR');
  const hasKitchen = stations.has('KITCHEN');
  if (hasBar && hasKitchen) return 'Cocina + barra';
  if (hasBar) return 'Barra';
  if (hasKitchen) return 'Cocina';
  return 'Estación';
}

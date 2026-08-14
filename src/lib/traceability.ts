export type TraceCategory =
  | 'all'
  | 'invoices'
  | 'inventory'
  | 'team'
  | 'prices'
  | 'other';

export type TraceEvent = {
  id: string;
  source: 'operacion' | 'equipo';
  action: string;
  createdAt: string;
  actor: string;
  summary: string;
  entityType: string | null;
  entityId: string | null;
  oldValue: unknown;
  newValue: unknown;
};

const ACTION_LABELS: Record<string, string> = {
  INVOICE_UPDATED: 'Factura editada',
  INVOICE_VOIDED: 'Factura anulada',
  INVOICE_ADJUSTED: 'Monto ajustado',
  INVOICE_DELETED: 'Factura eliminada',
  INVOICE_UPLOADED: 'Compra importada',
  PRODUCT_PRICE_UPDATE: 'Precio de producto',
  AUTOCONSUMO_REGISTERED: 'Autoconsumo / merma',
  INVENTORY_ADJUSTMENT: 'Ajuste de inventario',
  EXCHANGE_RATE_UPDATE: 'Cambio de tasa',
  CURRENCY_UPDATE: 'Cambio de tasa / moneda',
  MEMBER_DEACTIVATED: 'Usuario desactivado',
  MEMBER_ROLE_CHANGE: 'Cambio de rol',
  PASSWORD_CHANGE: 'Cambio de contraseña',
  CIERRE_CAJA: 'Cierre de caja',
};

export const TRACE_CATEGORIES: { value: TraceCategory; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: 'invoices', label: 'Facturas' },
  { value: 'inventory', label: 'Inventario' },
  { value: 'prices', label: 'Precios' },
  { value: 'team', label: 'Equipo' },
  { value: 'other', label: 'Otros' },
];

export function traceActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
}

export function traceCategory(action: string): Exclude<TraceCategory, 'all'> {
  if (action.startsWith('INVOICE_') && action !== 'INVOICE_UPLOADED') return 'invoices';
  if (
    action === 'AUTOCONSUMO_REGISTERED' ||
    action === 'INVENTORY_ADJUSTMENT' ||
    action === 'INVOICE_UPLOADED'
  ) {
    return 'inventory';
  }
  if (action === 'PRODUCT_PRICE_UPDATE') return 'prices';
  if (
    action.startsWith('MEMBER_') ||
    action === 'PASSWORD_CHANGE'
  ) {
    return 'team';
  }
  if (action === 'EXCHANGE_RATE_UPDATE' || action === 'CURRENCY_UPDATE') return 'other';
  return 'other';
}

export function traceEntityHref(event: TraceEvent): string | null {
  const type = (event.entityType || '').toLowerCase();
  const id = event.entityId;
  if (!id) return null;
  if (type === 'invoice') return `/invoices?detalle=${id}`;
  if (type === 'product') return '/products';
  if (type === 'inventory_movement') return '/inventory/movements';
  if (type === 'member' || type === 'organization') return '/settings/team';
  if (type === 'invoice_upload') return '/inventory/invoice-upload';
  return null;
}

export function formatTraceDate(iso: string): string {
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function formatTraceValue(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function traceDiffLines(
  oldValue: unknown,
  newValue: unknown,
): { key: string; from: string; to: string }[] {
  if (!isRecord(oldValue) && !isRecord(newValue)) return [];
  const oldRec = isRecord(oldValue) ? oldValue : {};
  const newRec = isRecord(newValue) ? newValue : {};
  const keys = Array.from(new Set([...Object.keys(oldRec), ...Object.keys(newRec)]));
  return keys.map((key) => ({
    key,
    from: formatTraceValue(oldRec[key]),
    to: formatTraceValue(newRec[key]),
  }));
}

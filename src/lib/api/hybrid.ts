import { AxiosError } from 'axios';
import { apiClient } from './client';

/** Listados / catálogos (Hybrid README v0.4: ~60s). */
export const HYBRID_LIST_TIMEOUT_MS = 60_000;
/** Detalle de venta (primera carga puede ser lenta: ~180s). */
export const HYBRID_DETAIL_TIMEOUT_MS = 180_000;

/** @deprecated usar HYBRID_LIST_TIMEOUT_MS / HYBRID_DETAIL_TIMEOUT_MS */
export const HYBRID_REQUEST_TIMEOUT_MS = HYBRID_LIST_TIMEOUT_MS;

/** Espejo allowlist backend HYBRID_VENTAS_QUERY_KEYS (v0.4 incluye caja/serie). */
export const HYBRID_VENTAS_QUERY_KEYS = [
  'q',
  'desde',
  'hasta',
  'campo_fecha',
  'documento',
  'numero_control',
  'tipo',
  'status',
  'visible',
  'rif',
  'nit',
  'usuario',
  'deposito',
  'moneda',
  'caja',
  'serie',
  'documento_origen',
  'limit',
  'offset',
] as const;

export type HybridVentasQueryKey = (typeof HYBRID_VENTAS_QUERY_KEYS)[number];

export type HybridVentasParams = Partial<
  Record<HybridVentasQueryKey, string | number | undefined | null>
>;

export type HybridVentaDetailParams = {
  limit?: string | number | null;
  offset?: string | number | null;
};

export type HybridCatalogItem = {
  codigo?: string | number | null;
  nombre?: string | null;
  cantidad?: number | null;
  fuente?: string | null;
  [key: string]: unknown;
};

export type HybridCatalogos = {
  tipos_venta?: HybridCatalogItem[];
  status_venta?: HybridCatalogItem[];
  cajas?: HybridCatalogItem[];
  series?: HybridCatalogItem[];
  monedas?: HybridCatalogItem[];
  [key: string]: unknown;
};

export type HybridVentaListItem = {
  documento?: string | number | null;
  fecha?: string | null;
  cliente?: string | { nombre?: string | null } | null;
  tipo_nombre?: string | null;
  status_nombre?: string | null;
  neto?: string | number | null;
  moneda_simbolo?: string | null;
  serie?: string | null;
  caja?: string | null;
  [key: string]: unknown;
};

export type HybridVentaDetalleLine = {
  nombre?: string | null;
  cantidad?: string | number | null;
  precio?: string | number | null;
  importe?: string | number | null;
  [key: string]: unknown;
};

export type HybridVentaDetail = {
  cabecera?: HybridVentaListItem | null;
  detalle?: HybridVentaDetalleLine[] | null;
  detalle_total?: number | null;
  [key: string]: unknown;
};

export type HybridVentasListResult = {
  items: HybridVentaListItem[];
  total?: number;
  raw: unknown;
};

function pickAllowlisted(
  params: Record<string, unknown> | undefined,
  allowed: readonly string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!params) return out;

  for (const key of allowed) {
    const value = params[key];
    if (value === undefined || value === null) continue;
    const s = String(value).trim();
    if (s === '') continue;
    out[key] = s;
  }
  return out;
}

function asListItems(data: unknown): HybridVentaListItem[] {
  if (Array.isArray(data)) return data as HybridVentaListItem[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const candidate = obj.items ?? obj.data ?? obj.ventas ?? obj.results;
    if (Array.isArray(candidate)) return candidate as HybridVentaListItem[];
  }
  return [];
}

function asTotal(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const total = (data as Record<string, unknown>).total;
  return typeof total === 'number' && Number.isFinite(total) ? total : undefined;
}

function asCatalogItems(data: unknown, group?: string): HybridCatalogItem[] {
  if (Array.isArray(data)) return data as HybridCatalogItem[];
  if (!data || typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;
  if (group && Array.isArray(obj[group])) {
    return obj[group] as HybridCatalogItem[];
  }
  if (Array.isArray(obj.items)) return obj.items as HybridCatalogItem[];
  return [];
}

/** Mensaje legible para errores Hybrid (503 / timeout / resto). */
export function getHybridErrorMessage(
  err: unknown,
  fallback = 'No se pudo consultar Hybrid',
): string {
  if (err instanceof AxiosError) {
    if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
      return 'La consulta tardó demasiado. Intente de nuevo o reduzca el rango de fechas.';
    }
    const status = err.response?.status;
    const data = err.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (status === 503) {
      if (typeof msg === 'string' && msg.trim()) return msg;
      return 'Hybrid API no configurada en el servidor. Defina HYBRID_API_BASE_URL y HYBRID_API_TOKEN en el backend.';
    }
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (Array.isArray(msg)) return msg.join(', ');
    if (status === 404) return 'Recurso no encontrado';
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function formatHybridCliente(
  cliente: HybridVentaListItem['cliente'],
): string {
  if (cliente == null) return '—';
  if (typeof cliente === 'string') return cliente || '—';
  if (typeof cliente === 'object' && cliente.nombre) return String(cliente.nombre);
  return '—';
}

export function formatHybridMoney(
  neto: string | number | null | undefined,
  simbolo: string | null | undefined,
): string {
  if (neto == null || neto === '') return '—';
  const n = typeof neto === 'number' ? neto : Number(neto);
  const amount = Number.isFinite(n)
    ? n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(neto);
  const sym = (simbolo ?? '').trim();
  return sym ? `${sym} ${amount}` : amount;
}

/** Catálogos Hybrid (combos). No hardcodear tipos/status. */
export async function getHybridCatalogos(): Promise<HybridCatalogos> {
  const { data } = await apiClient.get<HybridCatalogos>('/hybrid/catalogos', {
    timeout: HYBRID_LIST_TIMEOUT_MS,
  });
  return data ?? {};
}

export async function getHybridCatalogo(
  grupo: string,
): Promise<HybridCatalogItem[]> {
  const encoded = encodeURIComponent(grupo);
  const { data } = await apiClient.get<unknown>(`/hybrid/catalogos/${encoded}`, {
    timeout: HYBRID_LIST_TIMEOUT_MS,
  });
  return asCatalogItems(data, grupo);
}

export async function getHybridMonedas(): Promise<HybridCatalogItem[]> {
  const { data } = await apiClient.get<unknown>('/hybrid/monedas', {
    timeout: HYBRID_LIST_TIMEOUT_MS,
  });
  return asCatalogItems(data);
}

/** Lista ventas Hybrid vía backend Marfyl (nunca URL Hybrid directa). */
export async function getHybridVentas(
  params?: HybridVentasParams,
): Promise<HybridVentasListResult> {
  const query = pickAllowlisted(
    params as Record<string, unknown> | undefined,
    HYBRID_VENTAS_QUERY_KEYS,
  );
  const { data } = await apiClient.get<unknown>('/hybrid/ventas', {
    params: query,
    timeout: HYBRID_LIST_TIMEOUT_MS,
  });
  return {
    items: asListItems(data),
    total: asTotal(data),
    raw: data,
  };
}

/** Detalle de una venta Hybrid por documento. */
export async function getHybridVenta(
  documento: string,
  params?: HybridVentaDetailParams,
): Promise<HybridVentaDetail> {
  const query = pickAllowlisted(params as Record<string, unknown> | undefined, [
    'limit',
    'offset',
  ]);
  const encoded = encodeURIComponent(documento);
  const { data } = await apiClient.get<HybridVentaDetail>(
    `/hybrid/ventas/${encoded}`,
    {
      params: query,
      timeout: HYBRID_DETAIL_TIMEOUT_MS,
    },
  );
  return data ?? {};
}

export const hybridService = {
  getCatalogos: getHybridCatalogos,
  getCatalogo: getHybridCatalogo,
  getMonedas: getHybridMonedas,
  getVentas: getHybridVentas,
  getVenta: getHybridVenta,
};

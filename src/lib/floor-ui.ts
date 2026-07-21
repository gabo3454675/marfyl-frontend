import type { FloorOrderStatus, FloorStation } from '@/lib/api/floor-orders';

/** Lenguaje único del módulo Servicio en piso */
export const FLOOR_COPY = {
  module: 'Servicio en piso',
  host: {
    short: 'Anfitrión',
    title: 'Tomar pedido',
    blurb: 'Arma el pedido y envíalo. No cobras aquí.',
  },
  kitchen: {
    short: 'Cocina · Barra',
    title: 'Cola de preparación',
    blurb: 'Cocina = comida · Barra = bebidas. Marca lista cuando esté listo.',
  },
  audit: {
    short: 'Auditoría',
    title: 'Pedidos cobrados',
    blurb: 'Quién tomó cada pedido y cuánto se cobró.',
  },
  pos: {
    short: 'Caja',
    blurb: 'Cobra cuando esté lista.',
  },
} as const;

export const FLOOR_STATUS_LABEL: Record<FloorOrderStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviado',
  IN_PREP: 'Preparando',
  READY: 'Lista · cobro',
  CHARGED: 'Cobrada',
  CANCELLED: 'Cancelada',
};

export const FLOOR_STATUS_TONE: Record<string, string> = {
  SENT: 'bg-sky-500/15 text-sky-200 border-sky-500/35',
  IN_PREP: 'bg-amber-500/15 text-amber-100 border-amber-500/35',
  READY: 'bg-emerald-500/15 text-emerald-100 border-emerald-500/35',
  CHARGED: 'bg-muted text-muted-foreground border-border/60',
  CANCELLED: 'bg-destructive/10 text-destructive border-destructive/30',
};

export const FLOOR_STATION_META: Record<
  FloorStation,
  { label: string; className: string }
> = {
  BAR: {
    label: 'barra',
    className: 'text-amber-500',
  },
  KITCHEN: {
    label: 'cocina',
    className: 'text-sky-400',
  },
  OTHER: {
    label: 'otro',
    className: 'text-muted-foreground',
  },
};

export function floorStatusLabel(status: FloorOrderStatus | string): string {
  return FLOOR_STATUS_LABEL[status as FloorOrderStatus] ?? status;
}

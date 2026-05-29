import type { TaskForResolution } from '@/components/task-resolution-modal';
import { PREVIEW_OFFLINE_HINT } from '@/lib/api/get-error-message';
import type { FiscalAlertItem, FiscalComplianceMode } from '@/types/fiscal-calendar-hub';

function isConnectivityMessage(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes('network error') ||
    m.includes('conexión') ||
    m.includes('conexion') ||
    m.includes('puerto 3001') ||
    m.includes('postgresql') ||
    m.includes('base de datos')
  );
}

export type FeedItemKind =
  | 'task'
  | 'invoice'
  | 'stock'
  | 'rate'
  | 'fiscal'
  | 'system'
  | 'empty';

export type FeedItemIcon = 'clock' | 'alert' | 'check' | 'task' | 'shield' | 'fiscal';

export interface NotificationFeedItem {
  id: string;
  kind: FeedItemKind;
  title: string;
  description: string;
  timeLabel: string;
  status: 'pending' | 'urgent' | 'completed';
  icon: FeedItemIcon;
  task?: TaskForResolution;
  invoiceId?: number;
  productId?: number;
  href?: string;
  openRateModal?: boolean;
}

type Invoice = {
  id: number;
  status: string;
  createdAt?: string;
  customerName?: string;
};

type LowStockProduct = {
  id: number;
  sku?: string | null;
  name: string;
  stock: number;
};

export type FiscalFeedSnapshot = {
  mode: FiscalComplianceMode;
  modeReasons: string[];
  alerts: FiscalAlertItem[];
  overdue: number;
  upcoming: number;
  criticalAlerts: number;
  missingConfig: number;
  backendOnline: boolean;
  profileConfigured: boolean;
};

const timeAgo = (dateString?: string) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
};

function mapFiscalSeverity(severity: FiscalAlertItem['severity']): 'pending' | 'urgent' {
  return severity === 'critical' ? 'urgent' : 'pending';
}

function mapFiscalIcon(severity: FiscalAlertItem['severity']): FeedItemIcon {
  return severity === 'critical' ? 'alert' : 'fiscal';
}

export function buildNotificationFeedItems(input: {
  myTasks: TaskForResolution[];
  pendingInvoices: Invoice[];
  lowStockProducts: LowStockProduct[];
  showRateReminder: boolean;
  fiscal: FiscalFeedSnapshot | null;
  fiscalLoadError: string | null;
  operationalErrors: string[];
}): NotificationFeedItem[] {
  const items: NotificationFeedItem[] = [];

  const loadFailures = [
    ...input.operationalErrors,
    ...(input.fiscalLoadError ? [input.fiscalLoadError] : []),
  ];
  if (loadFailures.length > 0) {
    const offline = loadFailures.every(isConnectivityMessage);
    items.push({
      id: 'system-connectivity',
      kind: 'system',
      title: offline ? 'API o base de datos no disponible' : 'No se pudieron cargar algunos datos',
      description: offline
        ? PREVIEW_OFFLINE_HINT
        : loadFailures.slice(0, 3).join(' · '),
      status: offline ? 'pending' : 'urgent',
      timeLabel: offline ? 'Vista previa' : 'Revisar',
      icon: offline ? 'shield' : 'alert',
      href: '/',
    });
  }

  if (input.fiscal) {
    const f = input.fiscal;

    if (!f.backendOnline) {
      items.push({
        id: 'fiscal-offline',
        kind: 'fiscal',
        title: 'Módulo fiscal sin conexión',
        description: 'No se pudo validar obligaciones con el servidor. Revise red o reintente.',
        status: 'urgent',
        timeLabel: 'Seguridad',
        icon: 'shield',
        href: '/fiscal/calendario',
      });
    }

    if (f.mode === 'DIAGNOSTIC' || !f.profileConfigured) {
      items.push({
        id: 'fiscal-diagnostic',
        kind: 'fiscal',
        title: 'Perfil fiscal incompleto',
        description:
          f.modeReasons.length > 0
            ? f.modeReasons.join(' · ')
            : 'Complete RIF y régimen para activar calendario y alertas SENIAT.',
        status: 'urgent',
        timeLabel: 'Configuración',
        icon: 'shield',
        href: '/fiscal/perfil',
      });
    }

    if (f.overdue > 0) {
      items.push({
        id: 'fiscal-overdue',
        kind: 'fiscal',
        title:
          f.overdue === 1
            ? '1 obligación fiscal vencida'
            : `${f.overdue} obligaciones fiscales vencidas`,
        description: 'Revise el calendario SENIAT y regularice antes de multas o sanciones.',
        status: 'urgent',
        timeLabel: 'Vencido',
        icon: 'fiscal',
        href: '/fiscal/calendario',
      });
    } else if (f.upcoming > 0 && f.upcoming <= 3) {
      items.push({
        id: 'fiscal-upcoming',
        kind: 'fiscal',
        title:
          f.upcoming === 1
            ? '1 vencimiento fiscal próximo'
            : `${f.upcoming} vencimientos fiscales próximos`,
        description: 'Plazos en los próximos días según su perfil tributario.',
        status: 'pending',
        timeLabel: 'Calendario',
        icon: 'fiscal',
        href: '/fiscal/calendario',
      });
    }

    for (const alert of f.alerts.slice(0, 10)) {
      items.push({
        id: `fiscal-alert-${alert.id}`,
        kind: 'fiscal',
        title: alert.title,
        description: [alert.problem, alert.risk].filter(Boolean).join(' — ') || alert.action,
        status: mapFiscalSeverity(alert.severity),
        timeLabel: alert.blocksOperation ? 'Bloquea operación' : 'Fiscal',
        icon: mapFiscalIcon(alert.severity),
        href: alert.actionHref || '/fiscal/calendario',
      });
    }
  }

  for (const task of input.myTasks) {
    items.push({
      id: `task-${task.id}`,
      kind: 'task',
      title: task.title,
      description: task.description || (task.invoiceId ? `Factura #${task.invoiceId}` : 'Tarea asignada'),
      status: task.priority === 'HIGH' ? 'urgent' : 'pending',
      timeLabel: 'Tarea',
      icon: 'task',
      task,
    });
  }

  const sortedPending = [...input.pendingInvoices].sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });
  for (const inv of sortedPending.slice(0, 5)) {
    items.push({
      id: `inv-${inv.id}`,
      kind: 'invoice',
      title: 'Factura pendiente de cobro',
      description: `#${inv.id} · ${inv.customerName || 'Cliente'}`,
      status: 'pending',
      timeLabel: timeAgo(inv.createdAt),
      icon: 'clock',
      invoiceId: inv.id,
      href: `/invoices?detalle=${inv.id}`,
    });
  }

  for (const p of input.lowStockProducts.slice(0, 5)) {
    const skuLabel = p.sku ? `SKU ${p.sku}` : `ID ${p.id}`;
    items.push({
      id: `stock-${p.id}`,
      kind: 'stock',
      title: 'Stock bajo',
      description: `${p.name} · ${skuLabel} (stock ${p.stock})`,
      status: 'urgent',
      timeLabel: 'Inventario',
      icon: 'alert',
      productId: p.id,
      href: '/alertas-stock',
    });
  }

  if (input.showRateReminder) {
    items.push({
      id: 'rate-daily',
      kind: 'rate',
      title: 'Actualizar tasa del día',
      description: 'Confirma o registra la tasa BCV para cobrar bien en bolívares.',
      status: 'pending',
      timeLabel: 'Hoy',
      icon: 'clock',
      openRateModal: true,
    });
  }

  if (items.length === 0) {
    items.push({
      id: 'empty',
      kind: 'empty',
      title: 'Todo al día',
      description: 'No hay alertas ni recordatorios pendientes.',
      status: 'completed',
      timeLabel: '—',
      icon: 'check',
    });
  }

  const rank = (s: NotificationFeedItem['status']) =>
    s === 'urgent' ? 0 : s === 'pending' ? 1 : 2;
  const kindRank: Record<FeedItemKind, number> = {
    system: 0,
    fiscal: 1,
    task: 2,
    stock: 3,
    invoice: 4,
    rate: 5,
    empty: 9,
  };

  return [...items].sort((a, b) => {
    const dr = rank(a.status) - rank(b.status);
    if (dr !== 0) return dr;
    return kindRank[a.kind] - kindRank[b.kind];
  });
}

export function countActionableFeedItems(items: NotificationFeedItem[]): number {
  return items.filter((i) => i.kind !== 'empty').length;
}

export function getUrgentFeedItems(items: NotificationFeedItem[]): NotificationFeedItem[] {
  return items.filter((i) => i.status === 'urgent' && i.kind !== 'empty');
}

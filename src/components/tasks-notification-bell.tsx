'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  ListTodo,
  Loader2,
  Percent,
  Shield,
  Scale,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNotificationFeed, type NotificationFeedItem } from '@/hooks/useNotificationFeed';
import { usePermission } from '@/hooks/usePermission';
import { TaskResolutionModal, type TaskForResolution } from '@/components/task-resolution-modal';
import { InvoiceDetailSheet } from '@/components/invoice-detail-sheet';

const GROUP_LABELS: Record<string, string> = {
  system: 'Sistema y seguridad',
  fiscal: 'Fiscal SENIAT',
  task: 'Tareas',
  invoice: 'Cobranza',
  stock: 'Inventario',
  rate: 'Tasa BCV',
  empty: 'Estado',
};

function FeedIcon({ item }: { item: NotificationFeedItem }) {
  switch (item.icon) {
    case 'alert':
      return <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />;
    case 'check':
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />;
    case 'task':
      return <ListTodo className="h-4 w-4 shrink-0 text-blue-400" />;
    case 'shield':
      return <Shield className="h-4 w-4 shrink-0 text-amber-400" />;
    case 'fiscal':
      return <Scale className="h-4 w-4 shrink-0 text-[hsl(var(--fiscal-accent))]" />;
    case 'clock':
      return item.kind === 'rate' ? (
        <Percent className="h-4 w-4 shrink-0 text-amber-400" />
      ) : (
        <Clock className="h-4 w-4 shrink-0 text-yellow-400" />
      );
    default:
      return <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
}

function groupFeedItems(items: NotificationFeedItem[]) {
  const groups: { key: string; label: string; items: NotificationFeedItem[] }[] = [];
  for (const item of items) {
    const key = item.kind === 'empty' ? 'empty' : item.kind;
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.items.push(item);
    } else {
      groups.push({ key, label: GROUP_LABELS[key] ?? 'Alertas', items: [item] });
    }
  }
  return groups;
}

/**
 * Campanita: alertas operativas, fiscales y de sistema; toasts urgentes vía NotificationFeedProvider.
 */
export function TasksNotificationBell({ className }: { className?: string }) {
  const router = useRouter();
  const { feedItems, badgeCount, loading, error, refetch } = useNotificationFeed();
  const { canManageFiscal } = usePermission();
  const [menuOpen, setMenuOpen] = useState(false);
  const [resolutionTask, setResolutionTask] = useState<TaskForResolution | null>(null);
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [detailInvoiceId, setDetailInvoiceId] = useState<number | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<number | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const grouped = useMemo(() => groupFeedItems(feedItems), [feedItems]);

  const handleVerFactura = useCallback((invoiceId: number, taskId: number) => {
    setDetailInvoiceId(invoiceId);
    setDetailTaskId(taskId);
    setDetailSheetOpen(true);
  }, []);

  const activateItem = (item: NotificationFeedItem) => {
    if (item.kind === 'empty') return;
    setMenuOpen(false);
    if (item.kind === 'task' && item.task) {
      setResolutionTask(item.task);
      setResolutionModalOpen(true);
      return;
    }
    if (item.openRateModal) {
      window.dispatchEvent(new Event('open-rate-config-modal'));
      return;
    }
    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'relative inline-flex items-center justify-center rounded-lg border border-transparent p-2 transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px] min-w-[44px] touch-manipulation',
              className,
            )}
            title="Alertas, recordatorios fiscales y avisos de sistema"
            aria-label="Abrir notificaciones"
          >
            <Bell className="h-5 w-5 text-foreground" />
            {badgeCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[min(100vw-1rem,24rem)] p-0"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="border-b border-border px-3 py-2.5 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">Alertas y recordatorios</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fiscal, operación y avisos de carga
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Actualizar"
              onClick={() => refetch()}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>

          {error && (
            <div className="mx-2 mt-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando…
              </div>
            ) : (
              <div className="space-y-3">
                {grouped.map((group) => (
                  <div key={group.key}>
                    {group.key !== 'empty' && (
                      <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </p>
                    )}
                    <ul className="space-y-1">
                      {group.items.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            disabled={item.kind === 'empty'}
                            onClick={() => activateItem(item)}
                            className={cn(
                              'flex w-full gap-2 rounded-lg px-2 py-2.5 text-left text-sm transition-colors',
                              item.kind === 'empty'
                                ? 'opacity-80 cursor-default'
                                : 'hover:bg-accent focus:bg-accent focus:outline-none',
                              item.status === 'urgent' &&
                                item.kind !== 'empty' &&
                                'border border-red-500/25 bg-red-500/5',
                            )}
                          >
                            <div className="pt-0.5">
                              <FeedIcon item={item} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium leading-snug text-foreground line-clamp-2">
                                {item.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {item.description}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-1">{item.timeLabel}</p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border p-2 flex flex-col gap-1">
            {canManageFiscal && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => {
                  setMenuOpen(false);
                  router.push('/fiscal/calendario');
                }}
              >
                Calendario fiscal SENIAT
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-center text-xs"
              onClick={() => {
                setMenuOpen(false);
                router.push('/');
              }}
            >
              Ver panel de inicio
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <TaskResolutionModal
        task={resolutionTask}
        open={resolutionModalOpen}
        onOpenChange={setResolutionModalOpen}
        onDone={refetch}
        onVerFactura={handleVerFactura}
      />

      <InvoiceDetailSheet
        invoiceId={detailInvoiceId}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        taskId={detailTaskId}
        onRefresh={refetch}
      />
    </>
  );
}

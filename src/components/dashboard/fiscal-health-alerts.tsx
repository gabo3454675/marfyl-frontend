'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Loader2,
  ListTodo,
  Percent,
  Scale,
  Shield,
  Settings,
  Wrench,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminCard } from '@/components/admin/admin-card';
import { TaskResolutionModal, type TaskForResolution } from '@/components/task-resolution-modal';
import { InvoiceDetailSheet } from '@/components/invoice-detail-sheet';
import { useNotificationFeed, type NotificationFeedItem } from '@/hooks/useNotificationFeed';
import { cn } from '@/lib/utils';

function FiscalHealthGauge({ score, label }: { score: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, score));
  const color =
    clamped >= 80 ? 'text-emerald-400' : clamped >= 50 ? 'text-amber-400' : 'text-red-400';
  const stroke =
    clamped >= 80 ? '#34d399' : clamped >= 50 ? '#fbbf24' : '#f87171';

  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-lg font-bold tabular-nums', color)}>{clamped}%</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1 text-center max-w-[80px]">{label}</span>
    </div>
  );
}

function SectionIcon({ item }: { item: NotificationFeedItem }) {
  switch (item.icon) {
    case 'alert':
      return <AlertCircle className="h-5 w-5 text-red-400" />;
    case 'check':
      return <CheckCircle2 className="h-5 w-5 text-green-400" />;
    case 'task':
      return <ListTodo className="h-5 w-5 text-blue-400" />;
    case 'shield':
      return <Shield className="h-5 w-5 text-amber-400" />;
    case 'fiscal':
      return <Scale className="h-5 w-5 text-[hsl(var(--fiscal-accent))]" />;
    default:
      return <Clock className="h-5 w-5 text-yellow-400" />;
  }
}

function getActionButton(item: NotificationFeedItem): { label: string; variant: 'default' | 'outline' } | null {
  if (item.id === 'fiscal-diagnostic' || item.title.toLowerCase().includes('perfil fiscal')) {
    return { label: 'Configurar RIF', variant: 'default' };
  }
  if (item.id === 'fiscal-diagnostic-mode' || item.title.toLowerCase().includes('diagnóstico')) {
    return { label: 'Resolver Ahora', variant: 'default' };
  }
  if (item.kind === 'task') return { label: 'Resolver Ahora', variant: 'outline' };
  if (item.kind === 'invoice') return { label: 'Ver factura', variant: 'outline' };
  if (item.kind === 'stock') return { label: 'Ver inventario', variant: 'outline' };
  if (item.openRateModal) return { label: 'Actualizar tasa', variant: 'outline' };
  return item.href ? { label: 'Ir ahora', variant: 'outline' } : null;
}

function computeFiscalScore(items: NotificationFeedItem[]): number {
  const fiscalItems = items.filter((i) => i.kind === 'fiscal' || i.icon === 'shield');
  if (fiscalItems.length === 0) return 85;
  const urgent = fiscalItems.filter((i) => i.status === 'urgent').length;
  const pending = fiscalItems.filter((i) => i.status === 'pending').length;
  const penalty = urgent * 25 + pending * 10;
  return Math.max(15, 100 - penalty);
}

export function FiscalHealthAlerts() {
  const router = useRouter();
  const { feedItems, loading, error, refetch } = useNotificationFeed();
  const [resolutionTask, setResolutionTask] = useState<TaskForResolution | null>(null);
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [detailInvoiceId, setDetailInvoiceId] = useState<number | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<number | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const actionableItems = useMemo(
    () => feedItems.filter((n) => n.kind !== 'empty'),
    [feedItems],
  );
  const fiscalScore = useMemo(() => computeFiscalScore(actionableItems), [actionableItems]);

  const handleVerFactura = useCallback((invoiceId: number, taskId: number) => {
    setDetailInvoiceId(invoiceId);
    setDetailTaskId(taskId);
    setDetailSheetOpen(true);
  }, []);

  const handleAction = (item: NotificationFeedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.kind === 'task' && item.task) {
      setResolutionTask(item.task);
      setResolutionModalOpen(true);
      return;
    }
    if (item.openRateModal) {
      window.dispatchEvent(new Event('open-rate-config-modal'));
      return;
    }
    if (item.href) router.push(item.href);
  };

  const handleRowClick = (item: NotificationFeedItem) => {
    handleAction(item, { stopPropagation: () => {} } as React.MouseEvent);
  };

  return (
    <>
      <AdminCard
        title={
          <span className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Tareas y alertas
          </span>
        }
        description="Alertas operativas y fiscales con acciones inmediatas"
        headerActions={
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {actionableItems.length} pendiente{actionableItems.length === 1 ? '' : 's'}
          </Badge>
        }
        bodyClassName="space-y-4"
      >
        <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/40 border border-border/50">
          <FiscalHealthGauge score={fiscalScore} label="Salud Fiscal" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Score de Salud Fiscal</p>
            <p className="text-xs text-muted-foreground mt-1">
              {fiscalScore >= 80
                ? 'Tu perfil fiscal está en buen estado. Mantén el calendario al día.'
                : fiscalScore >= 50
                  ? 'Hay pendientes fiscales. Completa tu RIF y obligaciones SENIAT.'
                  : 'Atención urgente: perfil fiscal incompleto o modo diagnóstico activo.'}
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Cargando alertas...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {!loading &&
            !error &&
            feedItems.map((item) => {
              const action = getActionButton(item);
              const isFiscal =
                item.kind === 'fiscal' ||
                item.icon === 'shield' ||
                item.title.toLowerCase().includes('fiscal');

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex gap-3 sm:gap-4 p-4 rounded-xl border transition-all duration-200',
                    item.kind === 'empty'
                      ? 'bg-secondary/30 border-border/30 cursor-default'
                      : 'bg-secondary/50 border-border/40 hover:bg-secondary hover:border-primary/30 cursor-pointer group',
                    isFiscal && item.status === 'urgent' && 'border-red-500/30 bg-red-500/5',
                  )}
                  role={item.kind === 'empty' ? undefined : 'button'}
                  tabIndex={item.kind === 'empty' ? undefined : 0}
                  onClick={() => item.kind !== 'empty' && handleRowClick(item)}
                  onKeyDown={(e) => {
                    if (item.kind === 'empty') return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowClick(item);
                    }
                  }}
                >
                  <div className="flex-shrink-0 pt-0.5">
                    <SectionIcon item={item} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{item.timeLabel}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {isFiscal && (item.id === 'fiscal-diagnostic' || item.status === 'urgent') && (
                      <FiscalHealthGauge score={fiscalScore} label="Completado" />
                    )}
                    {item.status !== 'completed' && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs whitespace-nowrap',
                          item.status === 'urgent'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                        )}
                      >
                        {item.status === 'urgent' ? 'Urgente' : 'Pendiente'}
                      </Badge>
                    )}
                    {action && item.kind !== 'empty' && (
                      <Button
                        size="sm"
                        variant={action.variant}
                        className="text-xs h-8 opacity-90 group-hover:opacity-100 group-hover:shadow-md transition-all"
                        onClick={(e) => handleAction(item, e)}
                      >
                        {action.label === 'Configurar RIF' && <Settings className="h-3 w-3 mr-1" />}
                        {action.label === 'Resolver Ahora' && <Wrench className="h-3 w-3 mr-1" />}
                        {action.label === 'Actualizar tasa' && <Percent className="h-3 w-3 mr-1" />}
                        {action.label}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </AdminCard>

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

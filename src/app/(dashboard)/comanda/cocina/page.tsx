'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ChefHat,
  Loader2,
  Banknote,
  Timer,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  floorOrdersApi,
  type FloorOrder,
  type FloorOrderStatus,
} from '@/lib/api/floor-orders';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import { useComandaSocket } from '@/hooks/useComandaSocket';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { cn } from '@/lib/utils';

const COLUMNS: { key: FloorOrderStatus; label: string }[] = [
  { key: 'SENT', label: 'Nuevas' },
  { key: 'IN_PREP', label: 'En prep.' },
  { key: 'READY', label: 'Listas / caja' },
];

function orderTotal(order: FloorOrder) {
  return order.items.reduce(
    (s, i) => s + Number(i.unitPrice) * i.quantity,
    0,
  );
}

function OrderCard({
  order,
  onPrep,
  onReady,
  onCharge,
  onCancel,
  busy,
  canCharge,
}: {
  order: FloorOrder;
  onPrep: () => void;
  onReady: () => void;
  onCharge: () => void;
  onCancel: () => void;
  busy: boolean;
  canCharge: boolean;
}) {
  const { formatUsdAmount } = useDisplayCurrency();
  return (
    <div className="rounded-2xl border border-border/70 bg-card/90 p-3.5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold leading-tight">{order.tableLabel}</p>
          {order.customerName ? (
            <p className="text-sm text-foreground/90">{order.customerName}</p>
          ) : null}
          <p className="text-xs text-muted-foreground tabular-nums">
            #{order.id}
            {order.createdBy?.fullName ? ` · ${order.createdBy.fullName}` : ''}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {formatUsdAmount(orderTotal(order))}
        </Badge>
      </div>
      <ul className="mb-3 space-y-1.5">
        {order.items.map((item) => (
          <li key={item.id} className="text-sm leading-snug">
            <span className="font-medium tabular-nums">{item.quantity}×</span>{' '}
            {item.product?.name ?? `Producto ${item.productId}`}
            {item.station === 'BAR' && (
              <span className="ml-1 text-[11px] text-amber-500">barra</span>
            )}
            {item.notes ? (
              <span className="block text-xs text-muted-foreground">
                {item.notes}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {order.notes && (
        <p className="mb-3 text-xs text-muted-foreground">{order.notes}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {order.status === 'SENT' && (
          <Button
            type="button"
            className="min-h-12 flex-1 gap-1.5"
            disabled={busy}
            onClick={onPrep}
          >
            <Timer className="h-4 w-4" />
            Preparar
          </Button>
        )}
        {(order.status === 'SENT' || order.status === 'IN_PREP') && (
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 flex-1 gap-1.5"
            disabled={busy}
            onClick={onReady}
          >
            <Check className="h-4 w-4" />
            Lista
          </Button>
        )}
        {order.status === 'READY' && canCharge && (
          <p className="mb-2 w-full text-center text-[11px] text-muted-foreground">
            Lista: cobra en el POS (panel Comandas listas) o aquí.
          </p>
        )}
        {order.status === 'READY' && !canCharge && (
          <p className="mb-2 w-full text-center text-[11px] text-emerald-500/90">
            Lista · esperando cobro en caja
          </p>
        )}
        {order.status === 'READY' && canCharge && (
          <Button
            type="button"
            className="min-h-12 flex-1 gap-1.5"
            disabled={busy}
            onClick={onCharge}
          >
            <Banknote className="h-4 w-4" />
            Cobrar
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          className="min-h-12 gap-1.5 text-destructive"
          disabled={busy}
          onClick={onCancel}
        >
          <XCircle className="h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export default function ComandaCocinaPage() {
  const { selectedOrganizationId, selectedCompanyId } = useAuthStore();
  const orgId = selectedOrganizationId || selectedCompanyId;
  const { canViewKitchenQueue, canAccessPOS, isWaiterOnly } = usePermission();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<number | null>(null);

  useComandaSocket({ enabled: canViewKitchenQueue && !!orgId, playSound: true });

  const { data: orders = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['floor-orders', orgId, 'kitchen'],
    queryFn: () => floorOrdersApi.list(),
    enabled: !!orgId && canViewKitchenQueue,
    refetchInterval: 15_000,
  });

  const byStatus = useMemo(() => {
    const map: Record<string, FloorOrder[]> = {
      SENT: [],
      IN_PREP: [],
      READY: [],
    };
    for (const o of orders) {
      if (map[o.status]) map[o.status].push(o);
    }
    return map;
  }, [orders]);

  const run = async (id: number, fn: () => Promise<unknown>, ok: string) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(ok);
      void queryClient.invalidateQueries({ queryKey: ['floor-orders'] });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Error al actualizar comanda';
      toast.error(typeof msg === 'string' ? msg : 'Error al actualizar comanda');
    } finally {
      setBusyId(null);
    }
  };

  if (!canViewKitchenQueue) {
    return (
      <AdminPageShell title="Cola cocina" subtitle="Sin permiso">
        <p className="text-sm text-muted-foreground">
          Este puesto no opera la cola de cocina. Usa el rol Cocina (KITCHEN).
        </p>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Servicio en piso"
      title="Cola cocina"
      subtitle="Pedido → prepara → marca Lista. El cobro lo hace caja en el POS."
      actions={
        <div className="flex flex-wrap gap-2">
          {!isWaiterOnly && (
            <Button asChild variant="outline" className="h-10 min-h-12 sm:min-h-10">
              <Link href="/comanda">Tomar pedido</Link>
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            className="h-10 min-h-12 sm:min-h-10 gap-2"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChefHat className="h-4 w-4" />
            )}
            Actualizar
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <AdminCard
              key={col.key}
              title={
                <span className="inline-flex items-center gap-2">
                  {col.label}
                  <span
                    className={cn(
                      'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs tabular-nums',
                      'bg-muted text-muted-foreground',
                    )}
                  >
                    {byStatus[col.key]?.length ?? 0}
                  </span>
                </span>
              }
            >
              <div className="space-y-3">
                {(byStatus[col.key] ?? []).length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Vacío
                  </p>
                ) : (
                  (byStatus[col.key] ?? []).map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      busy={busyId === order.id}
                      canCharge={canAccessPOS}
                      onPrep={() =>
                        void run(
                          order.id,
                          () => floorOrdersApi.updateStatus(order.id, 'IN_PREP'),
                          'En preparación',
                        )
                      }
                      onReady={() =>
                        void run(
                          order.id,
                          () => floorOrdersApi.updateStatus(order.id, 'READY'),
                          'Lista para cobrar',
                        )
                      }
                      onCharge={() =>
                        void run(
                          order.id,
                          () =>
                            floorOrdersApi.charge(order.id, {
                              paymentMethod: 'CASH',
                            }),
                          'Cobrada',
                        )
                      }
                      onCancel={() => {
                        if (
                          !confirm(
                            `¿Cancelar comanda #${order.id} (${order.tableLabel})? Se libera el stock reservado.`,
                          )
                        ) {
                          return;
                        }
                        void run(
                          order.id,
                          () => floorOrdersApi.cancel(order.id),
                          'Comanda cancelada',
                        );
                      }}
                    />
                  ))
                )}
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}

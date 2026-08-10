'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, Loader2, UtensilsCrossed, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  floorOrdersApi,
  floorOrderStatusLabel,
  floorOrderTotal,
  type FloorOrder,
} from '@/lib/api/floor-orders';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import { useComandaSocket } from '@/hooks/useComandaSocket';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { cn } from '@/lib/utils';

/**
 * Cola de comandas para caja: pendientes de cobro + en preparación.
 * `chip` = botón compacto en la barra del POS (no ocupa altura del layout).
 */
export function PosComandaQueue({
  className,
  variant = 'panel',
}: {
  className?: string;
  variant?: 'panel' | 'chip';
}) {
  const { selectedOrganizationId, selectedCompanyId } = useAuthStore();
  const orgId = selectedOrganizationId || selectedCompanyId;
  const { canAccessPOS } = usePermission();
  const { formatUsdAmount } = useDisplayCurrency();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const enabled = !!orgId && canAccessPOS;

  useComandaSocket({ enabled, playSound: true });

  const { data: openOrders = [], isFetching } = useQuery({
    queryKey: ['floor-orders', orgId, 'pos-open'],
    queryFn: () => floorOrdersApi.list(),
    enabled,
    refetchInterval: 12_000,
  });

  const ready = useMemo(
    () => openOrders.filter((o) => o.status === 'READY'),
    [openOrders],
  );
  const inFlight = useMemo(
    () => openOrders.filter((o) => o.status === 'SENT' || o.status === 'IN_PREP'),
    [openOrders],
  );

  const chargeMutation = useMutation({
    mutationFn: (order: FloorOrder) =>
      floorOrdersApi.charge(order.id, {
        paymentMethod: 'CASH',
        customerId: order.customerId ?? undefined,
      }),
    onSuccess: ({ order }) => {
      toast.success(
        `Comanda #${order.id} cobrada · ${order.tableLabel}${order.customerName ? ` · ${order.customerName}` : ''}`,
      );
      void queryClient.invalidateQueries({ queryKey: ['floor-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'No se pudo cobrar la comanda';
      toast.error(typeof msg === 'string' ? msg : 'No se pudo cobrar');
    },
    onSettled: () => setBusyId(null),
  });

  if (!enabled) return null;

  const pendingCount = ready.length + inFlight.length;
  const hasReady = ready.length > 0;
  const label = hasReady ? 'Cobrar' : 'Piso';
  const count = hasReady ? ready.length : pendingCount;

  const listBody = (
    <div className="space-y-3">
      {ready.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-amber-200/90">
            Listas · cobrar ahora
          </p>
          <ul className="max-h-44 space-y-2 overflow-y-auto">
            {ready.map((order) => (
              <li
                key={order.id}
                className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-background/60 px-2.5 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight">
                    {order.tableLabel}
                    {order.customerName ? ` · ${order.customerName}` : ''}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    #{order.id}
                    {order.createdBy?.fullName
                      ? ` · ${order.createdBy.fullName}`
                      : ''}{' '}
                    · {formatUsdAmount(floorOrderTotal(order))}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-10 min-w-[5.5rem] shrink-0 gap-1"
                  disabled={busyId === order.id || chargeMutation.isPending}
                  onClick={() => {
                    setBusyId(order.id);
                    chargeMutation.mutate(order);
                  }}
                >
                  {busyId === order.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Banknote className="h-4 w-4" />
                  )}
                  Cobrar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {inFlight.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            En preparación
          </p>
          <ul className="max-h-28 space-y-1.5 overflow-y-auto">
            {inFlight.map((order) => (
              <li
                key={order.id}
                className="rounded-lg border border-border/40 bg-background/40 px-2.5 py-1.5"
              >
                <p className="truncate text-sm font-medium">
                  {order.tableLabel}
                  {order.customerName ? ` · ${order.customerName}` : ''}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  #{order.id} · {floorOrderStatusLabel(order.status)} ·{' '}
                  {formatUsdAmount(floorOrderTotal(order))}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendingCount === 0 && (
        <p className="py-1 text-xs text-muted-foreground leading-snug">
          Sin comandas. Cuando anfitrión envíe y cocina marque «Lista», aparecen aquí.
        </p>
      )}
    </div>
  );

  if (variant === 'chip') {
    return (
      <div className={cn('relative shrink-0', className)}>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium touch-manipulation transition-colors',
            hasReady
              ? 'border-amber-500/50 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25'
              : 'border-border/70 bg-card/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground',
          )}
        >
          {hasReady ? (
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <UtensilsCrossed className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="hidden min-[380px]:inline">{label}</span>
          <Badge
            variant={hasReady ? 'default' : 'secondary'}
            className="h-5 min-w-5 px-1.5 text-[10px] tabular-nums"
          >
            {count}
          </Badge>
          {isFetching && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </button>

        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Cerrar pedidos en piso"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-label="Pedidos en piso"
              className={cn(
                'absolute right-0 top-[calc(100%+0.35rem)] z-50 w-[min(22rem,calc(100vw-1.5rem))]',
                'rounded-xl border border-border/70 bg-card p-3 shadow-xl',
                hasReady && 'border-amber-500/35',
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold">
                  {hasReady ? 'Pendiente de cobrar' : 'Pedidos en piso'}
                </p>
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  Cerrar
                </button>
              </div>
              {listBody}
            </div>
          </>
        )}
      </div>
    );
  }

  // Panel clásico (otras pantallas / fallback)
  if (pendingCount === 0) return null;

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-xl border',
        hasReady
          ? 'border-amber-500/45 bg-amber-500/10'
          : 'border-border/70 bg-card/80',
        className,
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/30"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          {hasReady ? (
            <AlertCircle className="h-4 w-4 text-amber-400" />
          ) : (
            <UtensilsCrossed className="h-4 w-4 text-primary" />
          )}
          {hasReady ? 'Pendiente de cobrar' : 'Pedidos en piso'}
          <Badge
            variant={hasReady ? 'default' : 'secondary'}
            className="tabular-nums"
          >
            {hasReady ? ready.length : pendingCount}
          </Badge>
          {isFetching && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
        </span>
        <span className="text-xs text-muted-foreground">
          {open ? 'Ocultar' : 'Mostrar'}
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border/60 px-3 pb-3 pt-2">
          {listBody}
        </div>
      )}
    </div>
  );
}

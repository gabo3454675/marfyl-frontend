'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, Loader2, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  floorOrdersApi,
  floorOrderTotal,
  type FloorOrder,
} from '@/lib/api/floor-orders';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import { useComandaSocket } from '@/hooks/useComandaSocket';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { cn } from '@/lib/utils';

/**
 * Cola de comandas listas para cobrar desde el POS (caja).
 */
export function PosComandaQueue({ className }: { className?: string }) {
  const { selectedOrganizationId, selectedCompanyId } = useAuthStore();
  const orgId = selectedOrganizationId || selectedCompanyId;
  const { canAccessPOS } = usePermission();
  const { formatUsdAmount } = useDisplayCurrency();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [open, setOpen] = useState(true);

  const enabled = !!orgId && canAccessPOS;

  useComandaSocket({ enabled, playSound: true });

  const { data: ready = [], isFetching } = useQuery({
    queryKey: ['floor-orders', orgId, 'READY'],
    queryFn: () => floorOrdersApi.list({ status: 'READY' }),
    enabled,
    refetchInterval: 12_000,
  });

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

  return (
    <div
      className={cn(
        'shrink-0 rounded-xl border border-border/70 bg-card/80 overflow-hidden',
        className,
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/30"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <UtensilsCrossed className="h-4 w-4 text-primary" />
          Comandas listas
          <Badge variant="secondary" className="tabular-nums">
            {ready.length}
          </Badge>
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </span>
        <span className="text-xs text-muted-foreground">
          {open ? 'Ocultar' : 'Mostrar'}
        </span>
      </button>

      {open && (
        <div className="border-t border-border/60 px-3 pb-3 pt-2">
          {ready.length === 0 ? (
            <p className="py-2 text-xs text-muted-foreground">
              No hay comandas listas. Cuando cocina marque «Lista», aparecen aquí
              para cobrar.
            </p>
          ) : (
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {ready.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 px-2.5 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight">
                      {order.tableLabel}
                      {order.customerName ? ` · ${order.customerName}` : ''}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      #{order.id} · {order.items.length} ítem
                      {order.items.length === 1 ? '' : 's'} ·{' '}
                      {formatUsdAmount(floorOrderTotal(order))}
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
          )}
          <div className="mt-2">
            <p className="text-[11px] text-muted-foreground">
              Cobras aquí. Cocina marca «Lista»; anfitrión toma el pedido.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

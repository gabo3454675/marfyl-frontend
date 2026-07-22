'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Loader2,
  Users,
  ChevronDown,
  ChevronRight,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  floorOrdersApi,
  floorOrderTotal,
  type FloorOrder,
  type OpenTabCustomer,
} from '@/lib/api/floor-orders';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { cn } from '@/lib/utils';

/**
 * Panel de cuentas abiertas para caja.
 * Muestra clientes con órdenes acumuladas y permite cobrar todo de una vez.
 */
export function PosOpenTabs({ className }: { className?: string }) {
  const { selectedOrganizationId, selectedCompanyId } = useAuthStore();
  const orgId = selectedOrganizationId || selectedCompanyId;
  const { canAccessPOS } = usePermission();
  const { formatUsdAmount } = useDisplayCurrency();
  const queryClient = useQueryClient();

  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
  const [chargeModalCustomerId, setChargeModalCustomerId] = useState<number | null>(null);

  const enabled = !!orgId && canAccessPOS;

  const { data: openTabs = [], isFetching } = useQuery({
    queryKey: ['floor-orders', orgId, 'open-tabs'],
    queryFn: () => floorOrdersApi.getOpenTabs(),
    enabled,
    refetchInterval: 15_000,
  });

  const chargeMutation = useMutation({
    mutationFn: ({ customerId, paymentMethod }: { customerId: number; paymentMethod: string }) =>
      floorOrdersApi.chargeCustomerOpenTab(customerId, { paymentMethod }),
    onSuccess: ({ orders, invoice }) => {
      const count = orders.length;
      const total = orders.reduce(
        (sum, o) => sum + o.items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0),
        0,
      );
      toast.success(
        `Cuenta abierta cobrada · ${count} orden${count === 1 ? '' : 'es'} · ${formatUsdAmount(total)}`,
        {
          description: `Factura creada exitosamente.`,
          duration: 8_000,
        },
      );
      setChargeModalCustomerId(null);
      void queryClient.invalidateQueries({ queryKey: ['floor-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'No se pudo cobrar la cuenta';
      toast.error(typeof msg === 'string' ? msg : 'No se pudo cobrar la cuenta');
    },
  });

  if (!enabled || openTabs.length === 0) return null;

  const totalGeneral = openTabs.reduce((sum, t) => sum + t.totalUsd, 0);

  return (
    <div
      className={cn(
        'shrink-0 rounded-xl border overflow-hidden',
        'border-blue-500/40 bg-blue-500/8',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4 text-blue-400" />
          Cuentas abiertas
          <Badge variant="secondary" className="tabular-nums">
            {openTabs.length}
          </Badge>
          {isFetching && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
        </span>
        <span className="text-xs font-medium tabular-nums text-blue-300">
          {formatUsdAmount(totalGeneral)}
        </span>
      </div>

      <div className="border-t border-blue-500/20 px-3 pb-3 pt-2 space-y-2">
        {openTabs.map((tab) => (
          <div
            key={tab.customerId}
            className="rounded-lg border border-blue-500/25 bg-background/60 overflow-hidden"
          >
            {/* Customer header */}
            <button
              type="button"
              className="flex w-full items-center gap-2 px-2.5 py-2 text-left hover:bg-muted/30"
              onClick={() =>
                setExpandedCustomerId(
                  expandedCustomerId === tab.customerId ? null : tab.customerId,
                )
              }
            >
              {expandedCustomerId === tab.customerId ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{tab.customerName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {tab.ordersCount} orden{tab.ordersCount === 1 ? '' : 'es'}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-blue-300">
                {formatUsdAmount(tab.totalUsd)}
              </span>
            </button>

            {/* Expanded detail */}
            {expandedCustomerId === tab.customerId && (
              <div className="max-h-[min(28dvh,16rem)] overflow-y-auto overscroll-y-contain border-t border-blue-500/20 px-2.5 py-2 space-y-2">
                {tab.orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">
                        #{order.id} · {order.tableLabel}
                        {order.zone ? ` · ${order.zone}` : ''}
                      </p>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatUsdAmount(floorOrderTotal(order))}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {order.items.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px]"
                        >
                          {item.product?.name || `#${item.productId}`} ×{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  className="w-full gap-2"
                  onClick={() => setChargeModalCustomerId(tab.customerId)}
                >
                  <Banknote className="h-4 w-4" />
                  Cobrar todo · {formatUsdAmount(tab.totalUsd)}
                </Button>
              </div>
            )}
          </div>
        ))}

        <p className="text-[11px] text-muted-foreground leading-snug">
          Las cuentas abiertas acumulan órdenes. Cobra todo junto al final.
        </p>
      </div>

      {/* Charge confirmation modal */}
      {chargeModalCustomerId !== null && (
        <ChargeModal
          customerId={chargeModalCustomerId}
          tab={openTabs.find((t) => t.customerId === chargeModalCustomerId)}
          onConfirm={(paymentMethod) =>
            chargeMutation.mutate({ customerId: chargeModalCustomerId, paymentMethod })
          }
          onCancel={() => setChargeModalCustomerId(null)}
          isPending={chargeMutation.isPending}
          formatUsdAmount={formatUsdAmount}
        />
      )}
    </div>
  );
}

/* ─── Charge Modal ────────────────────────────────────────── */

function ChargeModal({
  customerId,
  tab,
  onConfirm,
  onCancel,
  isPending,
  formatUsdAmount,
}: {
  customerId: number;
  tab?: OpenTabCustomer;
  onConfirm: (paymentMethod: string) => void;
  onCancel: () => void;
  isPending: boolean;
  formatUsdAmount: (n: number) => string;
}) {
  const [method, setMethod] = useState('CASH');

  if (!tab) return null;

  const methods = [
    { value: 'CASH', label: '💵 Efectivo' },
    { value: 'CARD', label: '💳 Tarjeta' },
    { value: 'PAGO_MOVIL', label: '📱 Pago móvil' },
    { value: 'ZELLE', label: '💸 Zelle' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Cobrar cuenta abierta</h3>
        </div>

        <div className="mb-4 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
          <p className="text-sm font-medium">{tab.customerName}</p>
          <p className="text-xs text-muted-foreground">
            {tab.ordersCount} orden{tab.ordersCount === 1 ? '' : 'es'} ·{' '}
            {formatUsdAmount(tab.totalUsd)}
          </p>
        </div>

        <div className="mb-4 space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Método de pago
          </p>
          <div className="grid grid-cols-2 gap-2">
            {methods.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition',
                  method === m.value
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/60',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 mb-4">
          <span className="text-sm text-muted-foreground">Total a cobrar</span>
          <span className="text-lg font-bold tabular-nums">
            {formatUsdAmount(tab.totalUsd)}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1 gap-2"
            onClick={() => onConfirm(method)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Banknote className="h-4 w-4" />
            )}
            Confirmar cobro
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  Loader2,
  UserRound,
  Calendar,
} from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  floorOrdersApi,
  type FloorOrderHistoryLine,
} from '@/lib/api/floor-orders';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { FloorServiceNav } from '@/components/floor/floor-service-nav';
import { FLOOR_COPY } from '@/lib/floor-ui';
import { formatBeerQty, isBeerProduct } from '@/lib/liquor-units';
import { cn } from '@/lib/utils';

function currentMonthCaracas(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
  })
    .format(new Date())
    .slice(0, 7);
}

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-VE', {
    timeZone: 'America/Caracas',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function OrderExpand({ order }: { order: FloorOrderHistoryLine }) {
  return (
    <ul className="mt-1 space-y-0.5 text-[12px] text-muted-foreground">
      {order.items.map((i) => (
        <li key={i.id}>
          <span className="tabular-nums font-medium text-foreground/80">
            {isBeerProduct(i.name) ? formatBeerQty(i.quantity) : `${i.quantity}×`}
          </span>{' '}
          {i.name}
          {i.station === 'BAR' && (
            <span className="ml-1 text-amber-500">barra</span>
          )}
          {i.station === 'KITCHEN' && (
            <span className="ml-1 text-sky-400">cocina</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function ComandaHistorialPage() {
  const { selectedOrganizationId, selectedCompanyId } = useAuthStore();
  const orgId = selectedOrganizationId || selectedCompanyId;
  const { canViewFloorHistory } = usePermission();
  const { formatUsdAmount } = useDisplayCurrency();

  const [month, setMonth] = useState(currentMonthCaracas);
  const [hostFilter, setHostFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  const createdById =
    hostFilter !== 'all' ? Number(hostFilter) : undefined;

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['floor-orders-history', orgId, month, createdById],
    queryFn: () =>
      floorOrdersApi.history({
        month,
        createdById: Number.isFinite(createdById) ? createdById : undefined,
      }),
    enabled: !!orgId && canViewFloorHistory,
  });

  const hosts = useMemo(() => data?.summary.byUser ?? [], [data]);

  if (!canViewFloorHistory) {
    return (
      <AdminPageShell title={FLOOR_COPY.audit.title} subtitle="Sin permiso">
        <p className="text-sm text-muted-foreground">
          No tienes acceso a la auditoría de pedidos de piso.
        </p>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow={FLOOR_COPY.module}
      title={FLOOR_COPY.audit.title}
      subtitle={
        data?.seeAll
          ? FLOOR_COPY.audit.blurb
          : 'Tus pedidos cobrados del período'
      }
      actions={
        <Button
          type="button"
          variant="secondary"
          className="h-10"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Actualizar'
          )}
        </Button>
      }
    >
      <FloorServiceNav />
      <div className="space-y-5">
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/70 bg-card/50 px-4 py-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="hist-month" className="text-xs text-muted-foreground">
              Mes
            </Label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="hist-month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-10 w-[11.5rem] pl-9"
              />
            </div>
          </div>
          {data?.seeAll && (
            <div className="space-y-1.5 min-w-[12rem]">
              <Label className="text-xs text-muted-foreground">Anfitrión</Label>
              <Select value={hostFilter} onValueChange={setHostFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los anfitriones</SelectItem>
                  {hosts.map((h) => (
                    <SelectItem key={h.userId} value={String(h.userId)}>
                      {h.fullName} ({h.orders})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {data && (
            <p className="pb-2 text-xs text-muted-foreground">
              {data.from} → {data.to}
            </p>
          )}
        </div>

        {error && (
          <AdminCard title="Error">
            <p className="text-sm text-destructive">
              No se pudo cargar el historial.
            </p>
          </AdminCard>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Pedidos cobrados
                </p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">
                  {data.summary.orders}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Total USD
                </p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">
                  {formatUsdAmount(data.summary.totalUsd)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Anfitriones
                </p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">
                  {data.summary.byUser.length}
                </p>
              </div>
            </div>

            {data.seeAll && data.summary.byUser.length > 0 && (
              <AdminCard
                title={
                  <span className="inline-flex items-center gap-2">
                    <UserRound className="h-4 w-4" />
                    Por anfitrión
                  </span>
                }
              >
                <ul className="divide-y divide-border/50">
                  {data.summary.byUser.map((row) => (
                    <li
                      key={row.userId}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <button
                        type="button"
                        className="text-left text-sm font-medium hover:text-primary"
                        onClick={() => setHostFilter(String(row.userId))}
                      >
                        {row.fullName}
                      </button>
                      <div className="text-right tabular-nums">
                        <p className="text-sm font-semibold">
                          {row.orders} pedido{row.orders === 1 ? '' : 's'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatUsdAmount(row.totalUsd)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </AdminCard>
            )}

            <AdminCard
              title={
                <span className="inline-flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Detalle
                </span>
              }
            >
              {data.orders.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay pedidos cobrados en este período.
                </p>
              ) : (
                <AdminTableWrap>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cobrado</TableHead>
                        <TableHead>Mesa / cliente</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Anfitrión
                        </TableHead>
                        <TableHead className="text-right">Factura</TableHead>
                        <TableHead className="text-right">USD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders.map((o) => {
                        const open = expanded === o.id;
                        return (
                          <Fragment key={o.id}>
                            <TableRow
                              className={cn(
                                'cursor-pointer',
                                open && 'bg-muted/30',
                              )}
                              onClick={() =>
                                setExpanded(open ? null : o.id)
                              }
                            >
                              <TableCell className="tabular-nums text-sm whitespace-nowrap">
                                {formatWhen(o.chargedAt)}
                              </TableCell>
                              <TableCell>
                                <p className="font-medium text-sm leading-snug">
                                  {o.tableLabel}
                                  {o.customerName ? ` · ${o.customerName}` : ''}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Pedido #{o.id}
                                </p>
                                {open && <OrderExpand order={o} />}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm">
                                {o.createdBy.fullName || `Usuario #${o.createdBy.id}`}
                              </TableCell>
                              <TableCell className="text-right">
                                {o.invoiceConsecutive != null ? (
                                  <Badge variant="secondary" className="tabular-nums">
                                    #{o.invoiceConsecutive}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right tabular-nums font-medium">
                                {formatUsdAmount(o.totalUsd)}
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </AdminTableWrap>
              )}
            </AdminCard>
          </>
        ) : null}
      </div>
    </AdminPageShell>
  );
}

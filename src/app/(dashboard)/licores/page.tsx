'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Beer,
  Calendar,
  Loader2,
  Package,
  Wine,
  GlassWater,
} from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { liquorSalesApi, type LiquorPack } from '@/lib/api/liquor-sales';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

function yesterdayCaracas(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value);
  const d = Number(parts.find((p) => p.type === 'day')?.value);
  const prev = new Date(Date.UTC(y, m - 1, d) - 24 * 60 * 60 * 1000);
  return prev.toISOString().slice(0, 10);
}

function formatDayLabel(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 16));
  return dt.toLocaleDateString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function PackLine({ pack, showCases }: { pack: LiquorPack; showCases?: boolean }) {
  return (
    <div className="mt-3 space-y-1 text-sm">
      <p className="tabular-nums">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {pack.tobos}
        </span>{' '}
        <span className="text-muted-foreground">tobos</span>
        {pack.looseBottles > 0 && (
          <span className="text-muted-foreground">
            {' '}
            + {pack.looseBottles} bot.
          </span>
        )}
      </p>
      {showCases && (
        <p className="text-muted-foreground tabular-nums">
          ≈ <span className="font-medium text-foreground">{pack.cajas}</span> cajas
          {pack.tobosSueltos > 0 && (
            <span>
              {' '}
              + {pack.tobosSueltos} tobo{pack.tobosSueltos === 1 ? '' : 's'}
            </span>
          )}
          <span className="opacity-70"> ({pack.cajasExact} cajas exactas)</span>
        </p>
      )}
      <p className="text-xs text-muted-foreground tabular-nums">
        {pack.bottles} botellas · {pack.tobosExact} tobos exactos
      </p>
    </div>
  );
}

export default function LicoresPage() {
  const { selectedOrganizationId, selectedCompanyId } = useAuthStore();
  const orgId = selectedOrganizationId || selectedCompanyId;
  const { formatUsdAmount } = useDisplayCurrency();
  const [day, setDay] = useState(yesterdayCaracas);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['liquor-sales', orgId, day],
    queryFn: () => liquorSalesApi.getDaily(day),
    enabled: !!orgId,
    staleTime: 30_000,
  });

  // Si el backend cae al último día con ventas, alinea el date picker.
  useEffect(() => {
    if (data?.usedFallback && data.day && data.day !== day) {
      setDay(data.day);
    }
  }, [data?.usedFallback, data?.day, day]);

  const titleDay = useMemo(
    () => (data?.day ? formatDayLabel(data.day) : formatDayLabel(day)),
    [data?.day, day],
  );

  return (
    <AdminPageShell
      eyebrow="Ventas"
      title="Licores y tobos"
      subtitle="Cerveza en tobos de 12 y cajas de 3 tobos. Whisky y otros por unidad."
      actions={
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="licores-day" className="text-xs text-muted-foreground">
              Día
            </Label>
            <Input
              id="licores-day"
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-[11.5rem] h-10"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2"
            onClick={() => setDay(yesterdayCaracas())}
          >
            <Calendar className="h-4 w-4" />
            Ayer
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-10"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 sm:space-y-6">
        <p className="text-sm text-muted-foreground capitalize">{titleDay}</p>

        {error && (
          <AdminCard title="Error">
            <p className="text-sm text-destructive">
              No se pudo cargar el reporte. Revisa la API o el día seleccionado.
            </p>
          </AdminCard>
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {data && !isLoading && (
          <>
            {data.usedFallback && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[13px] sm:text-sm text-amber-100/95 leading-snug">
                No había licores el día pedido
                {data.requestedDay ? ` (${data.requestedDay})` : ''}. Mostrando el
                último día con ventas: <strong>{data.day}</strong>.
              </div>
            )}

            <section
              aria-label="Resumen cerveza"
              className={cn(
                'relative overflow-hidden rounded-2xl border border-border/70',
                'bg-gradient-to-br from-amber-500/[0.12] via-card/80 to-background',
                'px-4 py-5 sm:px-7 sm:py-7',
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl"
              />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Cerveza total del día
                  </p>
                  <PackLine pack={data.beer} showCases />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs leading-relaxed">
                  {data.rules.note}
                </p>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
              <AdminCard
                title={
                  <span className="inline-flex items-center gap-2">
                    <Beer className="h-4 w-4 text-sky-400" />
                    Light
                  </span>
                }
              >
                <PackLine pack={data.beer.light.pack} showCases />
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                  {formatUsdAmount(data.beer.light.usd)}
                </p>
              </AdminCard>

              <AdminCard
                title={
                  <span className="inline-flex items-center gap-2">
                    <Beer className="h-4 w-4 text-amber-500" />
                    Negra / pilsen
                  </span>
                }
              >
                <PackLine pack={data.beer.negra.pack} showCases />
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                  {formatUsdAmount(data.beer.negra.usd)}
                </p>
              </AdminCard>

              <AdminCard
                title={
                  <span className="inline-flex items-center gap-2">
                    <Wine className="h-4 w-4 text-primary" />
                    Whisky
                  </span>
                }
              >
                <p className="mt-2 tabular-nums">
                  <span className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    {data.whisky.bottles}
                  </span>{' '}
                  <span className="text-muted-foreground text-sm">unidades</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                  {formatUsdAmount(data.whisky.usd)}
                </p>
              </AdminCard>

              <AdminCard
                title={
                  <span className="inline-flex items-center gap-2">
                    <GlassWater className="h-4 w-4 text-emerald-400" />
                    Otros licores
                  </span>
                }
              >
                <p className="mt-2 tabular-nums">
                  <span className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    {data.otros.bottles}
                  </span>{' '}
                  <span className="text-muted-foreground text-sm">unidades</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                  {formatUsdAmount(data.otros.usd)}
                </p>
              </AdminCard>
            </div>

            {!!data.beer.byStyle?.length && (
              <AdminCard
                title={
                  <span className="inline-flex items-center gap-2">
                    <Beer className="h-4 w-4" />
                    Por tipo de cerveza
                  </span>
                }
              >
                <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
                  {data.beer.byStyle.map((style) => (
                    <div
                      key={style.key}
                      className="rounded-xl border border-border/60 bg-background/40 px-3.5 py-3"
                    >
                      <p className="text-sm font-medium">{style.label}</p>
                      <PackLine pack={style.pack} showCases />
                      <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                        {formatUsdAmount(style.usd)}
                      </p>
                    </div>
                  ))}
                </div>
              </AdminCard>
            )}

            <AdminCard
              title={
                <span className="inline-flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Detalle por producto
                </span>
              }
            >
              {data.products.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6">
                  No hay ventas de licores clasificadas este día.
                </p>
              ) : (
                <AdminTableWrap>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="hidden sm:table-cell">Grupo</TableHead>
                        <TableHead className="hidden md:table-cell">Marca / tipo</TableHead>
                        <TableHead className="text-right">Und.</TableHead>
                        <TableHead className="text-right hidden min-[400px]:table-cell">
                          Tobos / cajas
                        </TableHead>
                        <TableHead className="text-right">USD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.products.map((p) => (
                        <TableRow key={p.productId}>
                          <TableCell className="max-w-[14rem] sm:max-w-none">
                            <div className="font-medium text-sm leading-snug line-clamp-2">
                              {p.name}
                            </div>
                            <div className="sm:hidden text-[11px] text-muted-foreground mt-0.5">
                              {p.beerStyleLabel || p.bucketLabel}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                            {p.bucketLabel}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                            {p.beerStyleLabel || '—'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {p.quantity}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm text-muted-foreground hidden min-[400px]:table-cell">
                            {p.pack
                              ? `${p.pack.tobos} tobos` +
                                (p.pack.looseBottles
                                  ? ` +${p.pack.looseBottles}`
                                  : '') +
                                ` · ${p.pack.cajas} cajas`
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {formatUsdAmount(p.usd)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AdminTableWrap>
              )}
            </AdminCard>
          </>
        )}
      </div>
    </AdminPageShell>
  );
}

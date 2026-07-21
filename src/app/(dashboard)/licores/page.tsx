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
  Sparkles,
} from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
    <div className="mt-1 space-y-1 text-sm">
      <p className="tabular-nums">
        <span className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
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
        <p className="text-muted-foreground tabular-nums text-xs">
          ≈ <span className="font-medium text-foreground">{pack.cajas}</span> cajas
          {pack.tobosSueltos > 0 && (
            <span>
              {' '}
              + {pack.tobosSueltos} tobo{pack.tobosSueltos === 1 ? '' : 's'}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function TripleStock({
  opening,
  sold,
  remaining,
  packOpening,
  packSold,
  packRemaining,
  unitLabel = 'und.',
  showPack,
}: {
  opening: number;
  sold: number;
  remaining: number;
  packOpening?: LiquorPack | null;
  packSold?: LiquorPack | null;
  packRemaining?: LiquorPack | null;
  unitLabel?: string;
  showPack?: boolean;
}) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-xl bg-background/50 px-2 py-2">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Inicio</p>
        <p className="text-lg font-semibold tabular-nums">{opening}</p>
        {showPack && packOpening ? <PackLine pack={packOpening} /> : (
          <p className="text-[11px] text-muted-foreground">{unitLabel}</p>
        )}
      </div>
      <div className="rounded-xl bg-background/50 px-2 py-2">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Vendidos</p>
        <p className="text-lg font-semibold tabular-nums text-amber-500">{sold}</p>
        {showPack && packSold ? <PackLine pack={packSold} /> : (
          <p className="text-[11px] text-muted-foreground">{unitLabel}</p>
        )}
      </div>
      <div className="rounded-xl bg-background/50 px-2 py-2">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Quedan</p>
        <p className="text-lg font-semibold tabular-nums text-emerald-500">{remaining}</p>
        {showPack && packRemaining ? <PackLine pack={packRemaining} /> : (
          <p className="text-[11px] text-muted-foreground">{unitLabel}</p>
        )}
      </div>
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
      subtitle="Inicio automático → vendido → teórico restante. Tobos de 12 · cajas de 3 tobos."
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
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground capitalize">{titleDay}</p>
          <Badge variant="secondary" className="gap-1 font-normal">
            <Sparkles className="h-3 w-3" />
            Apertura automática
          </Badge>
        </div>

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
              <div className="relative">
                <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Cerveza total del día
                </p>
                <TripleStock
                  opening={data.beer.opening ?? data.beer.bottles}
                  sold={data.beer.bottles}
                  remaining={
                    data.beer.remainingTheoretical ??
                    Math.max(0, (data.beer.opening ?? data.beer.bottles) - data.beer.bottles)
                  }
                  packOpening={data.beer.packOpening}
                  packSold={data.beer}
                  packRemaining={data.beer.packRemaining}
                  showPack
                />
                <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed">
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
                <TripleStock
                  opening={data.beer.light.opening ?? data.beer.light.bottles}
                  sold={data.beer.light.bottles}
                  remaining={
                    data.beer.light.remainingTheoretical ??
                    Math.max(
                      0,
                      (data.beer.light.opening ?? data.beer.light.bottles) -
                        data.beer.light.bottles,
                    )
                  }
                  packOpening={data.beer.light.packOpening}
                  packSold={data.beer.light.pack}
                  packRemaining={data.beer.light.packRemaining}
                  showPack
                />
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
                <TripleStock
                  opening={data.beer.negra.opening ?? data.beer.negra.bottles}
                  sold={data.beer.negra.bottles}
                  remaining={
                    data.beer.negra.remainingTheoretical ??
                    Math.max(
                      0,
                      (data.beer.negra.opening ?? data.beer.negra.bottles) -
                        data.beer.negra.bottles,
                    )
                  }
                  packOpening={data.beer.negra.packOpening}
                  packSold={data.beer.negra.pack}
                  packRemaining={data.beer.negra.packRemaining}
                  showPack
                />
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
                <TripleStock
                  opening={data.whisky.opening ?? data.whisky.bottles}
                  sold={data.whisky.bottles}
                  remaining={
                    data.whisky.remainingTheoretical ??
                    Math.max(
                      0,
                      (data.whisky.opening ?? data.whisky.bottles) - data.whisky.bottles,
                    )
                  }
                />
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
                <TripleStock
                  opening={data.otros.opening ?? data.otros.bottles}
                  sold={data.otros.bottles}
                  remaining={
                    data.otros.remainingTheoretical ??
                    Math.max(
                      0,
                      (data.otros.opening ?? data.otros.bottles) - data.otros.bottles,
                    )
                  }
                />
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
                      <TripleStock
                        opening={style.opening ?? style.bottles}
                        sold={style.bottles}
                        remaining={
                          style.remainingTheoretical ??
                          Math.max(0, (style.opening ?? style.bottles) - style.bottles)
                        }
                        packOpening={style.packOpening}
                        packSold={style.pack}
                        packRemaining={style.packRemaining}
                        showPack
                      />
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
                  No hay licores con apertura o ventas este día.
                </p>
              ) : (
                <AdminTableWrap>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="hidden sm:table-cell">Grupo</TableHead>
                        <TableHead className="text-right">Inicio</TableHead>
                        <TableHead className="text-right">Vend.</TableHead>
                        <TableHead className="text-right">Quedan</TableHead>
                        <TableHead className="text-right hidden min-[400px]:table-cell">
                          Tobos
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
                            {p.beerStyleLabel || p.bucketLabel}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {p.opening ?? '—'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {p.quantity}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm text-emerald-500">
                            {p.remainingTheoretical ?? '—'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm text-muted-foreground hidden min-[400px]:table-cell">
                            {p.pack
                              ? `${p.pack.tobos} tobos` +
                                (p.pack.looseBottles
                                  ? ` +${p.pack.looseBottles}`
                                  : '')
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

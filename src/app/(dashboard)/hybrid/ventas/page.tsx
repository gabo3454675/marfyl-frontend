'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, Search } from 'lucide-react';
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
import { useHybridPageGate } from '@/hooks/useHybridPageGate';
import {
  formatHybridCliente,
  formatHybridMoney,
  getHybridErrorMessage,
  getHybridVentas,
  type HybridVentaListItem,
} from '@/lib/api/hybrid';

const PAGE_SIZE = 25;

function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultRange(): { desde: string; hasta: string } {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - 30);
  return { desde: toLocalYmd(desde), hasta: toLocalYmd(hasta) };
}

function formatFecha(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function documentoKey(item: HybridVentaListItem, index: number): string {
  if (item.documento != null && String(item.documento).trim() !== '') {
    return String(item.documento);
  }
  return `row-${index}`;
}

export default function HybridVentasPage() {
  const { ready, allowed } = useHybridPageGate();
  const initial = useMemo(() => defaultRange(), []);

  const [desde, setDesde] = useState(initial.desde);
  const [hasta, setHasta] = useState(initial.hasta);
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState({
    desde: initial.desde,
    hasta: initial.hasta,
    q: '',
  });
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<HybridVentaListItem[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getHybridVentas({
        desde: applied.desde || undefined,
        hasta: applied.hasta || undefined,
        q: applied.q || undefined,
        limit: PAGE_SIZE,
        offset,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setItems([]);
      setTotal(undefined);
      setError(getHybridErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [allowed, applied, offset]);

  useEffect(() => {
    if (!ready || !allowed) return;
    void load();
  }, [ready, allowed, load]);

  const applyFilters = () => {
    setOffset(0);
    setApplied({
      desde: desde.trim(),
      hasta: hasta.trim(),
      q: q.trim(),
    });
  };

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages =
    typeof total === 'number' && total > 0
      ? Math.max(1, Math.ceil(total / PAGE_SIZE))
      : null;
  const hasNext =
    totalPages != null
      ? page < totalPages
      : items.length >= PAGE_SIZE;
  const hasPrev = offset > 0;

  if (!ready || !allowed) {
    return (
      <AdminPageShell
        loading
        loadingLabel="Verificando acceso…"
        title="Consulta Hybrid"
      />
    );
  }

  return (
    <AdminPageShell
      eyebrow="Monddy · solo lectura"
      title="Consulta Hybrid"
      subtitle="Ventas Hybrid vía API Marfyl. No se modifica el sistema externo."
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Actualizar
        </Button>
      }
    >
      <AdminCard
        title="Filtros"
        description="Busque por texto y rango de fechas (desde / hasta)."
      >
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="hybrid-desde">Desde</Label>
            <Input
              id="hybrid-desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hybrid-hasta">Hasta</Label>
            <Input
              id="hybrid-hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="hybrid-q">Buscar</Label>
            <Input
              id="hybrid-q"
              placeholder="Documento, cliente…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </form>
      </AdminCard>

      <AdminCard
        className="mt-4 sm:mt-6"
        title="Ventas"
        description={
          typeof total === 'number'
            ? `${total.toLocaleString('es-VE')} resultado(s)`
            : 'Resultados de Hybrid'
        }
      >
        {error ? (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Consultando Hybrid…
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay ventas para los filtros seleccionados.
          </p>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {items.map((item, index) => {
                const doc = item.documento != null ? String(item.documento) : '';
                return (
                  <div
                    key={documentoKey(item, index)}
                    className="rounded-lg border border-border/60 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {doc || 'Sin documento'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFecha(item.fecha)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold shrink-0">
                        {formatHybridMoney(item.neto, item.moneda_simbolo)}
                      </p>
                    </div>
                    <p className="text-sm truncate">
                      {formatHybridCliente(item.cliente)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[item.tipo_nombre, item.status_nombre]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                    {doc ? (
                      <Button asChild variant="outline" size="sm" className="w-full cursor-pointer">
                        <Link href={`/hybrid/ventas/${encodeURIComponent(doc)}`}>
                          Ver detalle
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block">
              <AdminTableWrap>
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Neto</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      const doc =
                        item.documento != null ? String(item.documento) : '';
                      return (
                        <TableRow key={documentoKey(item, index)}>
                          <TableCell className="font-medium">
                            {doc || '—'}
                          </TableCell>
                          <TableCell>{formatFecha(item.fecha)}</TableCell>
                          <TableCell>
                            {formatHybridCliente(item.cliente)}
                          </TableCell>
                          <TableCell>{item.tipo_nombre || '—'}</TableCell>
                          <TableCell>{item.status_nombre || '—'}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatHybridMoney(item.neto, item.moneda_simbolo)}
                          </TableCell>
                          <TableCell className="text-right">
                            {doc ? (
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                              >
                                <Link
                                  href={`/hybrid/ventas/${encodeURIComponent(doc)}`}
                                >
                                  Ver
                                </Link>
                              </Button>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </AdminTableWrap>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Página {page}
                {totalPages != null ? ` de ${totalPages}` : ''}
                {typeof total === 'number'
                  ? ` · ${total.toLocaleString('es-VE')} total`
                  : ''}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={!hasPrev || loading}
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={!hasNext || loading}
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </AdminCard>
    </AdminPageShell>
  );
}

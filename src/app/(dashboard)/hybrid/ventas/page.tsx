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
import { useHybridPageGate } from '@/hooks/useHybridPageGate';
import {
  formatHybridCliente,
  formatHybridMoney,
  getHybridCatalogos,
  getHybridErrorMessage,
  getHybridVentas,
  type HybridCatalogItem,
  type HybridVentaListItem,
} from '@/lib/api/hybrid';

const PAGE_SIZE = 25;
/** Sentinel Radix Select: valor vacío no es válido en SelectItem. */
const FILTER_ALL = '__all__';

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

function asCatalogList(value: unknown): HybridCatalogItem[] {
  return Array.isArray(value) ? (value as HybridCatalogItem[]) : [];
}

function catalogOptionValue(item: HybridCatalogItem, index: number): string {
  if (item.codigo != null && String(item.codigo).trim() !== '') {
    return String(item.codigo);
  }
  if (item.nombre != null && String(item.nombre).trim() !== '') {
    return String(item.nombre);
  }
  return `opt-${index}`;
}

function catalogOptionLabel(item: HybridCatalogItem): string {
  const nombre = item.nombre != null ? String(item.nombre).trim() : '';
  const codigo = item.codigo != null ? String(item.codigo).trim() : '';
  if (nombre && codigo && nombre !== codigo) return `${codigo} — ${nombre}`;
  return nombre || codigo || '—';
}

type AppliedFilters = {
  desde: string;
  hasta: string;
  q: string;
  tipo: string;
  status: string;
  caja: string;
  serie: string;
};

function CatalogFilterSelect({
  id,
  label,
  value,
  onChange,
  items,
  placeholder,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  items: HybridCatalogItem[];
  placeholder: string;
  disabled?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value || FILTER_ALL}
        onValueChange={(v) => onChange(v === FILTER_ALL ? '' : v)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_ALL}>{placeholder}</SelectItem>
          {items.map((item, index) => {
            const opt = catalogOptionValue(item, index);
            return (
              <SelectItem key={`${id}-${opt}`} value={opt}>
                {catalogOptionLabel(item)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function HybridVentasPage() {
  const { ready, allowed } = useHybridPageGate();
  const initial = useMemo(() => defaultRange(), []);

  const [desde, setDesde] = useState(initial.desde);
  const [hasta, setHasta] = useState(initial.hasta);
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('');
  const [status, setStatus] = useState('');
  const [caja, setCaja] = useState('');
  const [serie, setSerie] = useState('');
  const [applied, setApplied] = useState<AppliedFilters>({
    desde: initial.desde,
    hasta: initial.hasta,
    q: '',
    tipo: '',
    status: '',
    caja: '',
    serie: '',
  });
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<HybridVentaListItem[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tiposVenta, setTiposVenta] = useState<HybridCatalogItem[]>([]);
  const [statusVenta, setStatusVenta] = useState<HybridCatalogItem[]>([]);
  const [cajas, setCajas] = useState<HybridCatalogItem[]>([]);
  const [series, setSeries] = useState<HybridCatalogItem[]>([]);
  const [catalogsLoading, setCatalogsLoading] = useState(false);
  const [catalogsError, setCatalogsError] = useState<string | null>(null);

  const loadCatalogos = useCallback(async () => {
    if (!allowed) return;
    setCatalogsLoading(true);
    setCatalogsError(null);
    try {
      const data = await getHybridCatalogos();
      setTiposVenta(asCatalogList(data.tipos_venta));
      setStatusVenta(asCatalogList(data.status_venta));
      setCajas(asCatalogList(data.cajas));
      setSeries(asCatalogList(data.series));
    } catch (err) {
      setTiposVenta([]);
      setStatusVenta([]);
      setCajas([]);
      setSeries([]);
      setCatalogsError(getHybridErrorMessage(err, 'No se pudieron cargar catálogos'));
    } finally {
      setCatalogsLoading(false);
    }
  }, [allowed]);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getHybridVentas({
        desde: applied.desde || undefined,
        hasta: applied.hasta || undefined,
        q: applied.q || undefined,
        tipo: applied.tipo || undefined,
        status: applied.status || undefined,
        caja: applied.caja || undefined,
        serie: applied.serie || undefined,
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
    void loadCatalogos();
  }, [ready, allowed, loadCatalogos]);

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
      tipo: tipo.trim(),
      status: status.trim(),
      caja: caja.trim(),
      serie: serie.trim(),
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
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <Link href="/hybrid/conexion">
              <Search className="mr-2 h-4 w-4" />
              Todas las consultas
            </Link>
          </Button>
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
        </div>
      }
    >
      <AdminCard
        title="Filtros"
        description="Busque por texto, fechas y catálogos Hybrid (tipo, estado, caja, serie)."
      >
        {catalogsError ? (
          <div
            role="status"
            className="mb-4 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
          >
            {catalogsError}. Puede filtrar por fechas y texto.
          </div>
        ) : null}

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

          <CatalogFilterSelect
            id="hybrid-tipo"
            label="Tipo"
            value={tipo}
            onChange={setTipo}
            items={tiposVenta}
            placeholder="Todos los tipos"
            disabled={catalogsLoading}
          />
          <CatalogFilterSelect
            id="hybrid-status"
            label="Estado"
            value={status}
            onChange={setStatus}
            items={statusVenta}
            placeholder="Todos los estados"
            disabled={catalogsLoading}
          />
          <CatalogFilterSelect
            id="hybrid-caja"
            label="Caja"
            value={caja}
            onChange={setCaja}
            items={cajas}
            placeholder="Todas las cajas"
            disabled={catalogsLoading}
          />
          <CatalogFilterSelect
            id="hybrid-serie"
            label="Serie"
            value={serie}
            onChange={setSerie}
            items={series}
            placeholder="Todas las series"
            disabled={catalogsLoading}
          />

          <div className="flex items-end sm:col-span-2 lg:col-span-1">
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
                          {item.serie != null && String(item.serie).trim() !== ''
                            ? ` · Serie ${String(item.serie)}`
                            : ''}
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
                <Table className="min-w-[820px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>Serie</TableHead>
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
                          <TableCell>
                            {item.serie != null && String(item.serie).trim() !== ''
                              ? String(item.serie)
                              : '—'}
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

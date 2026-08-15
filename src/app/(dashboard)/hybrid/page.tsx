'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  FileSearch,
  Loader2,
  Package,
  Search,
  Users,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHybridPageGate } from '@/hooks/useHybridPageGate';
import {
  formatHybridCliente,
  formatHybridMoney,
  getHybridClientes,
  getHybridErrorMessage,
  getHybridExistencia,
  getHybridInventario,
  getHybridVentas,
  type HybridClienteItem,
  type HybridExistenciaItem,
  type HybridInventarioItem,
  type HybridVentaListItem,
} from '@/lib/api/hybrid';

const PAGE_SIZE = 25;

// ============================================================================
// Utility helpers
// ============================================================================

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

function codigoKey(
  item: HybridInventarioItem | HybridClienteItem | HybridExistenciaItem,
  index: number,
): string {
  if (item.codigo != null && String(item.codigo).trim() !== '') {
    return String(item.codigo);
  }
  return `row-${index}`;
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—';
  return Number(value).toLocaleString('es-VE');
}

// ============================================================================
// Pagination component (reused across tabs)
// ============================================================================

function PaginationControls({
  page,
  totalPages,
  total,
  hasNext,
  hasPrev,
  loading,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number | null;
  total: number | undefined;
  hasNext: boolean;
  hasPrev: boolean;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
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
          onClick={onPrev}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={!hasNext || loading}
          onClick={onNext}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Ventas
// ============================================================================

function VentasTab({ active }: { active: boolean }) {
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<HybridVentaListItem[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getHybridVentas({
        q: q || undefined,
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
  }, [active, q, offset]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages =
    typeof total === 'number' && total > 0
      ? Math.max(1, Math.ceil(total / PAGE_SIZE))
      : null;
  const hasNext =
    totalPages != null ? page < totalPages : items.length >= PAGE_SIZE;
  const hasPrev = offset > 0;

  return (
    <div className="space-y-4">
      <AdminCard
        title="Filtros de Ventas"
        description="Busque por documento, cliente o texto libre."
      >
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setOffset(0);
            void load();
          }}
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="ventas-q">Buscar</Label>
            <Input
              id="ventas-q"
              placeholder="Documento, cliente…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={loading}
          >
            <Search className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
        </form>
      </AdminCard>

      <AdminCard
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
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {items.map((item, index) => {
                const doc =
                  item.documento != null ? String(item.documento) : '';
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
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full cursor-pointer"
                      >
                        <Link href={`/hybrid/ventas/${encodeURIComponent(doc)}`}>
                          Ver detalle
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <AdminTableWrap>
                <Table className="min-w-[700px]">
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

            <PaginationControls
              page={page}
              totalPages={totalPages}
              total={total}
              hasNext={hasNext}
              hasPrev={hasPrev}
              loading={loading}
              onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              onNext={() => setOffset((o) => o + PAGE_SIZE)}
            />
          </>
        )}
      </AdminCard>
    </div>
  );
}

// ============================================================================
// Tab: Inventario
// ============================================================================

function InventarioTab({ active }: { active: boolean }) {
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<HybridInventarioItem[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getHybridInventario({
        q: q || undefined,
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
  }, [active, q, offset]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages =
    typeof total === 'number' && total > 0
      ? Math.max(1, Math.ceil(total / PAGE_SIZE))
      : null;
  const hasNext =
    totalPages != null ? page < totalPages : items.length >= PAGE_SIZE;
  const hasPrev = offset > 0;

  return (
    <div className="space-y-4">
      <AdminCard
        title="Filtros de Inventario"
        description="Busque por código, nombre o referencia."
      >
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setOffset(0);
            void load();
          }}
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="inventario-q">Buscar</Label>
            <Input
              id="inventario-q"
              placeholder="Código, nombre, referencia…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={loading}
          >
            <Search className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
        </form>
      </AdminCard>

      <AdminCard
        title="Inventario"
        description={
          typeof total === 'number'
            ? `${total.toLocaleString('es-VE')} resultado(s)`
            : 'Productos en Hybrid'
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
            Consultando inventario…
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay productos para los filtros seleccionados.
          </p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {items.map((item, index) => (
                <div
                  key={codigoKey(item, index)}
                  className="rounded-lg border border-border/60 p-3 space-y-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {item.nombre || 'Sin nombre'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.codigo || '—'}
                      {item.referencia ? ` · Ref: ${item.referencia}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {item.familia ? <span>Familia: {item.familia}</span> : null}
                    {item.marca ? <span>Marca: {item.marca}</span> : null}
                    {item.unidad ? <span>Unidad: {item.unidad}</span> : null}
                    {item.moneda ? <span>Moneda: {item.moneda}</span> : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <AdminTableWrap>
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Familia</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Moneda</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={codigoKey(item, index)}>
                        <TableCell className="font-medium">
                          {item.codigo || '—'}
                        </TableCell>
                        <TableCell>{item.nombre || '—'}</TableCell>
                        <TableCell>{item.referencia || '—'}</TableCell>
                        <TableCell>{item.familia || '—'}</TableCell>
                        <TableCell>{item.marca || '—'}</TableCell>
                        <TableCell>{item.unidad || '—'}</TableCell>
                        <TableCell>{item.moneda || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTableWrap>
            </div>

            <PaginationControls
              page={page}
              totalPages={totalPages}
              total={total}
              hasNext={hasNext}
              hasPrev={hasPrev}
              loading={loading}
              onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              onNext={() => setOffset((o) => o + PAGE_SIZE)}
            />
          </>
        )}
      </AdminCard>
    </div>
  );
}

// ============================================================================
// Tab: Clientes
// ============================================================================

function ClientesTab({ active }: { active: boolean }) {
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<HybridClienteItem[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getHybridClientes({
        q: q || undefined,
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
  }, [active, q, offset]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages =
    typeof total === 'number' && total > 0
      ? Math.max(1, Math.ceil(total / PAGE_SIZE))
      : null;
  const hasNext =
    totalPages != null ? page < totalPages : items.length >= PAGE_SIZE;
  const hasPrev = offset > 0;

  return (
    <div className="space-y-4">
      <AdminCard
        title="Filtros de Clientes"
        description="Busque por código, nombre, RIF o NIT."
      >
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setOffset(0);
            void load();
          }}
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="clientes-q">Buscar</Label>
            <Input
              id="clientes-q"
              placeholder="Código, nombre, RIF…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={loading}
          >
            <Search className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
        </form>
      </AdminCard>

      <AdminCard
        title="Clientes"
        description={
          typeof total === 'number'
            ? `${total.toLocaleString('es-VE')} resultado(s)`
            : 'Clientes en Hybrid'
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
            Consultando clientes…
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay clientes para los filtros seleccionados.
          </p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {items.map((item, index) => (
                <div
                  key={codigoKey(item, index)}
                  className="rounded-lg border border-border/60 p-3 space-y-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {item.nombre || 'Sin nombre'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.codigo || '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {item.rif ? <span>RIF: {item.rif}</span> : null}
                    {item.nit ? <span>NIT: {item.nit}</span> : null}
                    {item.telefono ? <span>Tel: {item.telefono}</span> : null}
                  </div>
                  {item.email ? (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.email}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <AdminTableWrap>
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>RIF</TableHead>
                      <TableHead>NIT</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={codigoKey(item, index)}>
                        <TableCell className="font-medium">
                          {item.codigo || '—'}
                        </TableCell>
                        <TableCell>{item.nombre || '—'}</TableCell>
                        <TableCell>{item.rif || '—'}</TableCell>
                        <TableCell>{item.nit || '—'}</TableCell>
                        <TableCell>{item.telefono || '—'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {item.email || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTableWrap>
            </div>

            <PaginationControls
              page={page}
              totalPages={totalPages}
              total={total}
              hasNext={hasNext}
              hasPrev={hasPrev}
              loading={loading}
              onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              onNext={() => setOffset((o) => o + PAGE_SIZE)}
            />
          </>
        )}
      </AdminCard>
    </div>
  );
}

// ============================================================================
// Tab: Existencia
// ============================================================================

function ExistenciaTab({ active }: { active: boolean }) {
  const [codigo, setCodigo] = useState('');
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<HybridExistenciaItem[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getHybridExistencia({
        codigo: codigo || undefined,
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
  }, [active, codigo, offset]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages =
    typeof total === 'number' && total > 0
      ? Math.max(1, Math.ceil(total / PAGE_SIZE))
      : null;
  const hasNext =
    totalPages != null ? page < totalPages : items.length >= PAGE_SIZE;
  const hasPrev = offset > 0;

  return (
    <div className="space-y-4">
      <AdminCard
        title="Filtros de Existencia"
        description="Filtre por código de producto."
      >
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setOffset(0);
            void load();
          }}
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="existencia-codigo">Código</Label>
            <Input
              id="existencia-codigo"
              placeholder="Código de producto…"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={loading}
          >
            <Search className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
        </form>
      </AdminCard>

      <AdminCard
        title="Existencia"
        description={
          typeof total === 'number'
            ? `${total.toLocaleString('es-VE')} resultado(s)`
            : 'Existencias en Hybrid'
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
            Consultando existencias…
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay existencias para los filtros seleccionados.
          </p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {items.map((item, index) => (
                <div
                  key={codigoKey(item, index)}
                  className="rounded-lg border border-border/60 p-3 space-y-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {item.nombre || 'Sin nombre'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.codigo || '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {item.deposito ? (
                      <span className="text-muted-foreground">
                        Depósito: {item.deposito}
                      </span>
                    ) : null}
                    {item.lote ? (
                      <span className="text-muted-foreground">
                        Lote: {item.lote}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span>
                      Existencia:{' '}
                      <span className="font-semibold">
                        {formatNumber(item.existencia)}
                      </span>
                    </span>
                    <span>
                      Apartada:{' '}
                      <span className="font-semibold">
                        {formatNumber(item.apartada)}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <AdminTableWrap>
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Depósito</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead className="text-right">Existencia</TableHead>
                      <TableHead className="text-right">Apartada</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={codigoKey(item, index)}>
                        <TableCell className="font-medium">
                          {item.codigo || '—'}
                        </TableCell>
                        <TableCell>{item.nombre || '—'}</TableCell>
                        <TableCell>{item.deposito || '—'}</TableCell>
                        <TableCell>{item.lote || '—'}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatNumber(item.existencia)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(item.apartada)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTableWrap>
            </div>

            <PaginationControls
              page={page}
              totalPages={totalPages}
              total={total}
              hasNext={hasNext}
              hasPrev={hasPrev}
              loading={loading}
              onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              onNext={() => setOffset((o) => o + PAGE_SIZE)}
            />
          </>
        )}
      </AdminCard>
    </div>
  );
}

// ============================================================================
// Main page
// ============================================================================

export default function HybridPage() {
  const { ready, allowed } = useHybridPageGate();
  const [activeTab, setActiveTab] = useState('ventas');

  if (!ready || !allowed) {
    return (
      <AdminPageShell
        loading
        loadingLabel="Verificando acceso…"
        title="Hybrid"
      />
    );
  }

  return (
    <AdminPageShell
      eyebrow="Hybrid · solo lectura"
      title="Consulta Hybrid"
      subtitle="Consulte ventas, inventario, clientes y existencias de Hybrid POS vía API Marfyl."
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="ventas" className="gap-1.5">
            <FileSearch className="h-4 w-4" />
            <span className="hidden sm:inline">Ventas</span>
          </TabsTrigger>
          <TabsTrigger value="inventario" className="gap-1.5">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Inventario</span>
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="existencia" className="gap-1.5">
            <Box className="h-4 w-4" />
            <span className="hidden sm:inline">Existencia</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ventas">
          <VentasTab active={activeTab === 'ventas'} />
        </TabsContent>

        <TabsContent value="inventario">
          <InventarioTab active={activeTab === 'inventario'} />
        </TabsContent>

        <TabsContent value="clientes">
          <ClientesTab active={activeTab === 'clientes'} />
        </TabsContent>

        <TabsContent value="existencia">
          <ExistenciaTab active={activeTab === 'existencia'} />
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}

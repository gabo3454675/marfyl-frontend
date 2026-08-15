'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';
import { Button } from '@/components/ui/button';
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
  getHybridVenta,
  type HybridVentaDetail,
  type HybridVentaDetalleLine,
} from '@/lib/api/hybrid';

function formatFecha(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('es-VE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCell(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—';
  return String(value);
}

export default function HybridVentaDetailPage() {
  const params = useParams();
  const rawDocumento = params?.documento;
  const documento =
    typeof rawDocumento === 'string'
      ? decodeURIComponent(rawDocumento)
      : Array.isArray(rawDocumento)
        ? decodeURIComponent(rawDocumento[0] ?? '')
        : '';

  const { ready, allowed } = useHybridPageGate();
  const [detail, setDetail] = useState<HybridVentaDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!allowed || !documento) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getHybridVenta(documento);
      setDetail(data);
    } catch (err) {
      setDetail(null);
      setError(getHybridErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [allowed, documento]);

  useEffect(() => {
    if (!ready || !allowed) return;
    void load();
  }, [ready, allowed, load]);

  if (!ready || !allowed) {
    return (
      <AdminPageShell
        loading
        loadingLabel="Verificando acceso…"
        title="Detalle Hybrid"
      />
    );
  }

  const cabecera = detail?.cabecera ?? null;
  // Contrato Hybrid: líneas en `detalle`, no en cabecera.items
  const lineas: HybridVentaDetalleLine[] = Array.isArray(detail?.detalle)
    ? detail.detalle
    : [];

  return (
    <AdminPageShell
      eyebrow="Monddy · solo lectura"
      title={`Documento ${documento || '—'}`}
      subtitle="Cabecera y detalle de venta Hybrid (consulta)."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <Link href="/hybrid/ventas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
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
      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      {loading && !detail ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando detalle…
        </div>
      ) : (
        <>
          <AdminCard title="Cabecera">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Documento</dt>
                <dd className="font-medium">
                  {formatCell(cabecera?.documento ?? documento)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Fecha</dt>
                <dd className="font-medium">{formatFecha(cabecera?.fecha)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Cliente</dt>
                <dd className="font-medium">
                  {formatHybridCliente(cabecera?.cliente)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Tipo</dt>
                <dd className="font-medium">
                  {formatCell(cabecera?.tipo_nombre)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Estado</dt>
                <dd className="font-medium">
                  {formatCell(cabecera?.status_nombre)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Neto</dt>
                <dd className="font-semibold">
                  {formatHybridMoney(
                    cabecera?.neto,
                    cabecera?.moneda_simbolo,
                  )}
                </dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard
            className="mt-4 sm:mt-6"
            title="Detalle"
            description={
              typeof detail?.detalle_total === 'number'
                ? `${detail.detalle_total} línea(s)`
                : `${lineas.length} línea(s)`
            }
          >
            {lineas.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin líneas de detalle.
              </p>
            ) : (
              <AdminTableWrap>
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineas.map((line, index) => (
                      <TableRow key={`line-${index}`}>
                        <TableCell className="font-medium">
                          {formatCell(line.nombre)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCell(line.cantidad)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatHybridMoney(
                            line.precio,
                            cabecera?.moneda_simbolo,
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatHybridMoney(
                            line.importe,
                            cabecera?.moneda_simbolo,
                          )}
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
    </AdminPageShell>
  );
}

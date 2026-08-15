'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSearch,
  Loader2,
  RefreshCw,
  Upload,
  XCircle,
  Info,
} from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';
import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
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
  confirmHybridImport,
  getHybridErrorMessage,
  getHybridImportPreview,
  type HybridImportInvoicePreview,
  type HybridImportPreviewResult,
  type HybridImportResult,
} from '@/lib/api/hybrid';
import { toast } from 'sonner';

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

function formatMoney(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function documentoKey(item: HybridImportInvoicePreview, index: number): string {
  if (item.documento != null && String(item.documento).trim() !== '') {
    return String(item.documento);
  }
  return `row-${index}`;
}

// ============================================================================
// Status badge component
// ============================================================================

function StatusBadge({ status }: { status: HybridImportInvoicePreview['status'] }) {
  switch (status) {
    case 'ready':
      return (
        <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
          <CheckCircle2 className="h-3 w-3" />
          Lista
        </Badge>
      );
    case 'warning':
      return (
        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          Advertencia
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    case 'already_imported':
      return (
        <Badge variant="secondary" className="gap-1">
          <Download className="h-3 w-3" />
          Ya importada
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ============================================================================
// Issues popover (inline)
// ============================================================================

function IssuesList({ issues }: { issues: string[] }) {
  if (!issues || issues.length === 0) return null;
  return (
    <div className="mt-1 space-y-0.5">
      {issues.map((issue, i) => (
        <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
          <Info className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
          <span>{issue}</span>
        </p>
      ))}
    </div>
  );
}

// ============================================================================
// Result dialog
// ============================================================================

function ImportResultDialog({
  open,
  onOpenChange,
  result,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: HybridImportResult | null;
}) {
  if (!result) return null;

  const hasErrors = result.errors.length > 0;
  const hasSkipped = result.skipped.length > 0;
  const hasWarnings = result.warnings.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resultado de la importación</DialogTitle>
          <DialogDescription>
            Resumen de la operación de importación desde Hybrid.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{result.imported}</p>
              <p className="text-xs text-muted-foreground">Importadas</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold">{result.skipped.length}</p>
              <p className="text-xs text-muted-foreground">Omitidas</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{result.warnings.length}</p>
              <p className="text-xs text-muted-foreground">Advertencias</p>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-center">
              <p className="text-2xl font-bold text-destructive">{result.errors.length}</p>
              <p className="text-xs text-muted-foreground">Errores</p>
            </div>
          </div>

          {/* Imported */}
          {result.imported > 0 && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-sm font-medium text-emerald-700">
                ✓ {result.imported} venta(s) importada(s) exitosamente
              </p>
            </div>
          )}

          {/* Skipped */}
          {hasSkipped && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Omitidas ({result.skipped.length})</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {result.skipped.map((s, i) => (
                  <div key={i} className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs">
                    <p className="font-medium">{s.key}</p>
                    <p className="text-muted-foreground">{s.reason}</p>
                    {s.details && <p className="text-muted-foreground mt-0.5">{s.details}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-600">Advertencias ({result.warnings.length})</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {result.warnings.map((w, i) => (
                  <div key={i} className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
                    <p className="font-medium">{w.key}</p>
                    <p className="text-muted-foreground">{w.message}</p>
                    <p className="text-muted-foreground mt-0.5">Código: {w.code}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {hasErrors && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">Errores ({result.errors.length})</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div key={i} className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs">
                    <p className="font-medium">{e.key}</p>
                    <p className="text-destructive">{e.error}</p>
                    <p className="text-muted-foreground mt-0.5">Código: {e.code}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Confirm dialog
// ============================================================================

function ConfirmImportDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar importación</DialogTitle>
          <DialogDescription>
            Está a punto de importar <strong>{count}</strong> venta(s) de Hybrid a Marfyl.
            Esta operación creará facturas en el sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
          <p className="font-medium text-amber-700">⚠️ Operación destructiva</p>
          <p className="text-muted-foreground mt-1">
            Las ventas importadas se crearán como facturas en Marfyl. 
            Asegúrese de que los datos son correctos antes de continuar.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importar {count} venta(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main page
// ============================================================================

export default function HybridImportarPage() {
  const { ready, allowed } = useHybridPageGate();

  // Preview state
  const [previewData, setPreviewData] = useState<HybridImportPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Import state
  const [importing, setImporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [importResult, setImportResult] = useState<HybridImportResult | null>(null);

  // Load preview on mount
  const loadPreview = useCallback(async () => {
    if (!allowed) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setSelected(new Set());
    try {
      const data = await getHybridImportPreview();
      setPreviewData(data);
    } catch (err) {
      setPreviewData(null);
      setPreviewError(getHybridErrorMessage(err, 'No se pudo cargar el preview de importación'));
    } finally {
      setPreviewLoading(false);
    }
  }, [allowed]);

  useEffect(() => {
    if (!ready || !allowed) return;
    void loadPreview();
  }, [ready, allowed, loadPreview]);

  // Filter invoices by status
  const readyInvoices = useMemo(
    () => (previewData?.invoices ?? []).filter((inv) => inv.status === 'ready'),
    [previewData],
  );

  const allReadySelected = useMemo(
    () => readyInvoices.length > 0 && readyInvoices.every((inv) => selected.has(inv.documento)),
    [readyInvoices, selected],
  );

  const selectedReadyCount = useMemo(
    () => readyInvoices.filter((inv) => selected.has(inv.documento)).length,
    [readyInvoices, selected],
  );

  // Toggle individual
  const toggleItem = useCallback((documento: string, status: string) => {
    if (status !== 'ready') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(documento)) {
        next.delete(documento);
      } else {
        next.add(documento);
      }
      return next;
    });
  }, []);

  // Toggle all ready
  const toggleAllReady = useCallback(() => {
    setSelected((prev) => {
      if (allReadySelected) {
        return new Set();
      }
      return new Set(readyInvoices.map((inv) => inv.documento));
    });
  }, [allReadySelected, readyInvoices]);

  // Execute import
  const executeImport = useCallback(async () => {
    if (selectedReadyCount === 0) return;
    setImporting(true);
    setConfirmOpen(false);
    try {
      const documentos = Array.from(selected);
      const result = await confirmHybridImport(documentos);
      setImportResult(result);
      setResultOpen(true);
      toast.success(`Importación completada: ${result.imported} venta(s) importada(s)`);
      // Reload preview after import
      void loadPreview();
    } catch (err) {
      toast.error(getHybridErrorMessage(err, 'Error al importar ventas'));
    } finally {
      setImporting(false);
    }
  }, [selected, selectedReadyCount, loadPreview]);

  // Gate check
  if (!ready || !allowed) {
    return (
      <AdminPageShell
        loading
        loadingLabel="Verificando acceso…"
        title="Importar Hybrid"
      />
    );
  }

  const summary = previewData?.summary;

  return (
    <AdminPageShell
      eyebrow="Hybrid · Importación"
      title="Importar ventas de Hybrid"
      subtitle="Previsualice y importe ventas de Hybrid POS a Marfyl. Solo Super Admin."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <Link href="/hybrid/conexion">
              <FileSearch className="mr-2 h-4 w-4" />
              Consultas
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => void loadPreview()}
            disabled={previewLoading}
          >
            {previewLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Recargar preview
          </Button>
        </div>
      }
    >
      {/* Summary stats */}
      {summary && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-4 sm:mb-6">
          <AdminStatCard
            title="Ventas"
            value={summary.ventas}
            icon={FileSearch}
            hint="Total encontradas"
          />
          <AdminStatCard
            title="Líneas"
            value={summary.lineas}
            icon={FileSearch}
            hint="Detalle total"
          />
          <AdminStatCard
            title="Listas"
            value={summary.ready}
            icon={CheckCircle2}
            hint="Sin problemas"
            className="border-emerald-500/20"
          />
          <AdminStatCard
            title="Advertencias"
            value={summary.warnings}
            icon={AlertTriangle}
            hint="Revisar antes de importar"
            className="border-amber-500/20"
          />
          <AdminStatCard
            title="Errores"
            value={summary.errors}
            icon={XCircle}
            hint="No se pueden importar"
            className="border-destructive/20"
          />
          <AdminStatCard
            title="Ya importadas"
            value={summary.alreadyImported}
            icon={Download}
            hint="Duplicadas"
          />
        </div>
      )}

      {/* Preview table */}
      <AdminCard
        title="Preview de ventas"
        description={
          previewData
            ? `${previewData.invoices.length} venta(s) encontrada(s)`
            : 'Cargue el preview para ver las ventas disponibles'
        }
        headerActions={
          selectedReadyCount > 0 ? (
            <Button
              type="button"
              className="cursor-pointer"
              onClick={() => setConfirmOpen(true)}
              disabled={importing || selectedReadyCount === 0}
            >
              {importing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Importar seleccionadas ({selectedReadyCount})
            </Button>
          ) : null
        }
      >
        {previewError ? (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {previewError}
          </div>
        ) : null}

        {previewLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando preview de Hybrid…</p>
            <Progress value={undefined} className="w-48" />
          </div>
        ) : !previewData ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No hay datos de preview. Haga clic en &quot;Recargar preview&quot;.
            </p>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => void loadPreview()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Cargar ventas de Hybrid
            </Button>
          </div>
        ) : previewData.invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="text-sm text-muted-foreground">
              No hay ventas pendientes para importar.
            </p>
          </div>
        ) : (
          <>
            {/* Selection controls */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allReadySelected}
                    onChange={toggleAllReady}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    aria-label="Seleccionar todas las listas"
                  />
                  <span className="text-sm font-medium">
                    Seleccionar todas las listas
                  </span>
                </label>
                {selected.size > 0 && (
                  <Badge variant="secondary">{selected.size} seleccionada(s)</Badge>
                )}
              </div>
              {readyInvoices.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {readyInvoices.length} venta(s) lista(s) para importar
                </p>
              )}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {previewData.invoices.map((inv, index) => {
                const isReady = inv.status === 'ready';
                const isSelected = selected.has(inv.documento);
                return (
                  <div
                    key={documentoKey(inv, index)}
                    className={`rounded-lg border p-3 space-y-2 transition-colors ${
                      isSelected
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border/60'
                    } ${!isReady ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {isReady && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItem(inv.documento, inv.status)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                              aria-label={`Seleccionar ${inv.documento}`}
                            />
                          )}
                          <p className="font-medium truncate">{inv.documento}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatFecha(inv.fecha)} · {inv.cliente || '—'}
                        </p>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Hybrid: {inv.hybridStatus}</span>
                      <span>Marfyl: {inv.marfylStatus || '—'}</span>
                      <span className="font-semibold text-foreground">
                        {formatMoney(inv.totalAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{inv.lineCount} línea(s)</span>
                    </div>
                    <IssuesList issues={inv.issues} />
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <AdminTableWrap>
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <span className="sr-only">Seleccionar</span>
                      </TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status Hybrid</TableHead>
                      <TableHead>Status Marfyl</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Líneas</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.invoices.map((inv, index) => {
                      const isReady = inv.status === 'ready';
                      const isSelected = selected.has(inv.documento);
                      return (
                        <TableRow
                          key={documentoKey(inv, index)}
                          className={!isReady ? 'opacity-60' : undefined}
                        >
                          <TableCell>
                            {isReady ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleItem(inv.documento, inv.status)}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                aria-label={`Seleccionar ${inv.documento}`}
                              />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{inv.documento}</TableCell>
                          <TableCell>{formatFecha(inv.fecha)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {inv.cliente || '—'}
                          </TableCell>
                          <TableCell>{inv.hybridStatus}</TableCell>
                          <TableCell>{inv.marfylStatus || '—'}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatMoney(inv.totalAmount)}
                          </TableCell>
                          <TableCell>{inv.lineCount}</TableCell>
                          <TableCell>
                            <div>
                              <StatusBadge status={inv.status} />
                              <IssuesList issues={inv.issues} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </AdminTableWrap>
            </div>

            {/* Bottom action bar */}
            {selectedReadyCount > 0 && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border/60 bg-muted/30 p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <p className="text-sm font-medium">
                    {selectedReadyCount} venta(s) seleccionada(s) para importar
                  </p>
                </div>
                <Button
                  type="button"
                  className="cursor-pointer"
                  onClick={() => setConfirmOpen(true)}
                  disabled={importing}
                >
                  {importing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Importar seleccionadas
                </Button>
              </div>
            )}
          </>
        )}
      </AdminCard>

      {/* Confirm dialog */}
      <ConfirmImportDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        count={selectedReadyCount}
        onConfirm={() => void executeImport()}
        loading={importing}
      />

      {/* Result dialog */}
      <ImportResultDialog
        open={resultOpen}
        onOpenChange={setResultOpen}
        result={importResult}
      />
    </AdminPageShell>
  );
}

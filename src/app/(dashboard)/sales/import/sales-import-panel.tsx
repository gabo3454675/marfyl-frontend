'use client';

import { useCallback, useMemo, useState } from 'react';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';
import { ImportDropzone } from '@/components/import';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
  PackagePlus,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import {
  salesImportService,
  type SalesImportConfirmResult,
  type SalesImportInvoicePreview,
  type SalesImportInvoiceStatus,
  type SalesImportLinePreview,
  type SalesImportPreviewResult,
} from '@/lib/api/sales-import';
import { toast } from 'sonner';

type FilterStatus = 'all' | SalesImportInvoiceStatus;

function formatUsd(n: number) {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

function statusBadge(status: SalesImportInvoiceStatus) {
  switch (status) {
    case 'ready':
      return <Badge className="bg-emerald-600 hover:bg-emerald-600">Lista</Badge>;
    case 'warning':
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
          Advertencia
        </Badge>
      );
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    case 'already_imported':
      return <Badge variant="outline">Ya importada</Badge>;
  }
}

function StockValue({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <span>{value}</span>;
}

function StockDeltaValue({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (value === 0) {
    return <span className="text-muted-foreground">0</span>;
  }
  // El signo (negativo en ventas) viene del backend; solo se renderiza.
  return (
    <span className={value < 0 ? 'text-red-600' : 'text-emerald-600'}>{value}</span>
  );
}

function StockSummary({ line }: { line: SalesImportLinePreview }) {
  if (line.currentStock == null && line.stockDelta == null && line.finalStock == null) {
    return <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">Stock: —</p>;
  }
  const current = line.currentStock ?? '—';
  const final = line.finalStock ?? '—';
  return (
    <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
      Stock: {current} → {final} (
      {line.stockDelta == null ? (
        '—'
      ) : line.stockDelta === 0 ? (
        '0'
      ) : (
        <span className={line.stockDelta < 0 ? 'text-red-600' : 'text-emerald-600'}>
          {line.stockDelta}
        </span>
      )}
      )
    </p>
  );
}

export function SalesImportPanel() {
  const { selectedCompanyId } = useAuthStore();
  const { canManageInventory } = usePermission();

  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<SalesImportPreviewResult | null>(null);
  const [confirmResult, setConfirmResult] = useState<SalesImportConfirmResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [allowWarnings, setAllowWarnings] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      await salesImportService.downloadTemplate();
    } catch {
      toast.error('No se pudo descargar la plantilla');
    } finally {
      setDownloading(false);
    }
  };

  const importableCount = useMemo(() => {
    if (!preview) return 0;
    return preview.invoices.filter((inv) => {
      if (inv.status === 'already_imported' || inv.status === 'error') return false;
      if (inv.status === 'warning' && !allowWarnings) return false;
      return inv.status === 'ready' || inv.status === 'warning';
    }).length;
  }, [preview, allowWarnings]);

  const missingProductCount = useMemo(() => {
    if (!preview) return 0;
    const codes = new Set<string>();
    for (const inv of preview.invoices) {
      if (inv.status !== 'error') continue;
      for (const line of inv.lines) {
        if (!line.productId) codes.add(line.productCode);
      }
    }
    return codes.size;
  }, [preview]);

  const filteredInvoices = useMemo(() => {
    if (!preview) return [];
    if (filter === 'all') return preview.invoices;
    return preview.invoices.filter((i) => i.status === filter);
  }, [preview, filter]);

  const addFiles = useCallback((incoming: File[]) => {
    const list = incoming.filter(
      (f) => f.name.toLowerCase().endsWith('.xls') || f.name.toLowerCase().endsWith('.xlsx'),
    );
    if (list.length === 0) {
      toast.error('Usa la plantilla de ventas (.xls o .xlsx)');
      return;
    }
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      const merged = [...prev];
      for (const f of list) {
        if (!names.has(f.name)) merged.push(f);
      }
      return merged.slice(0, 10);
    });
    setPreview(null);
    setConfirmResult(null);
    setError(null);
  }, []);

  const runPreview = async () => {
    if (!files.length || !selectedCompanyId) return;
    setLoading(true);
    setError(null);
    setConfirmResult(null);
    try {
      const result = await salesImportService.preview(files);
      setPreview(result);
      setAllowWarnings(result.summary.warnings > 0);
      if (result.summary.errors > 0) setFilter('error');
      else if (result.summary.warnings > 0) setFilter('warning');
      else setFilter('all');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al analizar archivos';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const runProvision = async () => {
    if (!files.length) return;
    setProvisioning(true);
    try {
      const result = await salesImportService.provisionMissing(files);
      toast.success(`${result.created} productos creados en catálogo`);
      await runPreview();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear productos');
    } finally {
      setProvisioning(false);
    }
  };

  const runConfirm = async () => {
    if (!preview?.batchId) return;
    setConfirming(true);
    setConfirmOpen(false);
    try {
      const result = await salesImportService.confirm({
        batchId: preview.batchId,
        allowWarnings,
        skipStockValidation: true,
      });
      setConfirmResult(result);
      toast.success(`${result.imported} facturas importadas`);
      await runPreview();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al importar';
      setError(msg);
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  const toggleRow = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const resetAll = () => {
    setFiles([]);
    setPreview(null);
    setConfirmResult(null);
    setError(null);
    setExpanded(new Set());
  };

  if (!canManageInventory) {
    return (
      <p className="text-sm text-muted-foreground">No tienes permisos para importar ventas.</p>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <AdminCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Plantilla MARFYL (hoja DATOS) o reporte FastReport. El código debe ser el{' '}
              <strong>SKU</strong>. Las ya importadas no se duplican.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={downloadTemplate}
              disabled={downloading}
              className="h-11 w-full shrink-0 cursor-pointer sm:w-auto"
            >
              {downloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Descargar plantilla
            </Button>
          </div>
        </AdminCard>

        <AdminCard title="1. Archivos">
          <ImportDropzone
            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            multiple
            hint="Hasta 10 archivos .xls / .xlsx"
            files={files}
            onFiles={addFiles}
            onDownloadTemplate={downloadTemplate}
            downloadingTemplate={downloading}
          />

          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((f) => (
                <li
                  key={f.name}
                  className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-border/70 bg-card px-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="truncate">{f.name}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => {
                      setFiles((prev) => prev.filter((x) => x.name !== f.name));
                      setPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={runPreview}
              disabled={!files.length || loading || !selectedCompanyId}
              className="h-11 w-full cursor-pointer sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando…
                </>
              ) : (
                'Analizar archivos'
              )}
            </Button>
            {files.length > 0 && (
              <Button variant="outline" onClick={resetAll} className="h-11 w-full cursor-pointer sm:w-auto">
                Limpiar
              </Button>
            )}
          </div>
        </AdminCard>

        {error && (
          <AdminCard>
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          </AdminCard>
        )}

        {preview && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'Facturas', value: preview.summary.invoices },
                { label: 'Listas', value: preview.summary.ready, className: 'text-emerald-600' },
                { label: 'Avisos', value: preview.summary.warnings, className: 'text-amber-600' },
                { label: 'Errores', value: preview.summary.errors, className: 'text-destructive' },
                { label: 'Ya hechas', value: preview.summary.alreadyImported },
                { label: 'Líneas', value: preview.summary.lines },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-border/70 bg-card/70 px-3 py-3 sm:px-4"
                >
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{card.label}</p>
                  <p className={`mt-1 text-xl font-semibold tabular-nums sm:text-2xl ${card.className ?? ''}`}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {missingProductCount > 0 && (
              <AdminCard>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">SKU que no están en el catálogo</p>
                    <p className="text-sm text-muted-foreground">
                      Se pueden crear con el nombre y precio del Excel.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={runProvision}
                    disabled={provisioning}
                    className="h-11 w-full shrink-0 cursor-pointer sm:w-auto"
                  >
                    {provisioning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PackagePlus className="mr-2 h-4 w-4" />
                    )}
                    Crear {missingProductCount} productos
                  </Button>
                </div>
              </AdminCard>
            )}

            <AdminCard title="2. Revisión">
              <div className="-mx-1 flex gap-2 overflow-x-auto pb-3">
                {(
                  [
                    ['all', 'Todas'],
                    ['ready', 'Listas'],
                    ['warning', 'Avisos'],
                    ['error', 'Errores'],
                    ['already_imported', 'Ya hechas'],
                  ] as const
                ).map(([id, label]) => (
                  <Button
                    key={id}
                    size="sm"
                    variant={filter === id ? 'default' : 'outline'}
                    onClick={() => setFilter(id)}
                    className="h-10 shrink-0 cursor-pointer"
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {preview.summary.warnings > 0 && (
                <label className="mb-4 flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={allowWarnings}
                    onChange={(e) => setAllowWarnings(e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>Incluir facturas con diferencia de IVA</span>
                </label>
              )}

              <div className="space-y-2 md:hidden">
                {filteredInvoices.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Sin facturas en este filtro</p>
                ) : (
                  filteredInvoices.map((inv) => (
                    <InvoiceCard
                      key={inv.legacyKey}
                      inv={inv}
                      expanded={expanded.has(inv.legacyKey)}
                      onToggle={() => toggleRow(inv.legacyKey)}
                    />
                  ))
                )}
              </div>

              <AdminTableWrap className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead>Estado</TableHead>
                      <TableHead>Factura</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Líneas</TableHead>
                      <TableHead className="text-right">Total Excel</TableHead>
                      <TableHead className="text-right">Total calc.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                          Sin facturas en este filtro
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((inv) => (
                        <InvoiceRow
                          key={inv.legacyKey}
                          inv={inv}
                          expanded={expanded.has(inv.legacyKey)}
                          onToggle={() => toggleRow(inv.legacyKey)}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </AdminTableWrap>
            </AdminCard>

            <div className="sticky bottom-[calc(var(--app-bottom-chrome)+0.5rem)] z-20 rounded-2xl border border-border/80 bg-background/95 p-3 shadow-lg backdrop-blur-md md:bottom-4 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Se registrarán <strong className="text-foreground">{importableCount}</strong> facturas y
                  se baja el inventario.
                </p>
                <Button
                  size="lg"
                  disabled={importableCount === 0 || confirming}
                  onClick={() => setConfirmOpen(true)}
                  className="h-12 w-full cursor-pointer sm:w-auto"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando…
                    </>
                  ) : (
                    `Importar ${importableCount}`
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {confirmResult && (
          <AdminCard>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <p className="font-medium">Importación completada</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Importadas: {confirmResult.imported} · Fallidas: {confirmResult.failed}
                </p>
                {confirmResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-destructive">
                    {confirmResult.errors.map((e) => (
                      <li key={e.legacyKey}>
                        {e.legacyKey}: {e.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </AdminCard>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar importación</DialogTitle>
            <DialogDescription>
              Vas a importar {importableCount} facturas. Quedan cobradas, baja el stock y no se
              deshace fácil.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="h-11 w-full sm:w-auto" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button className="h-11 w-full sm:w-auto" onClick={runConfirm} disabled={confirming}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function InvoiceCard({
  inv,
  expanded,
  onToggle,
}: {
  inv: SalesImportInvoicePreview;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-3.5 text-left touch-manipulation"
      >
        {expanded ? (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(inv.status)}
            <span className="font-mono text-xs text-muted-foreground">{inv.legacyKey}</span>
          </div>
          <p className="mt-1 truncate text-sm font-medium">{inv.customer}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {inv.saleDate} · {inv.lineCount} líneas · {formatUsd(inv.excelTotal)}
          </p>
        </div>
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-border/60 px-3.5 py-3">
          {inv.issues.length > 0 && (
            <p className="text-sm text-amber-800 dark:text-amber-200">{inv.issues.join(' · ')}</p>
          )}
          {inv.lines.some((line) => line.stockDelta === 0) && (
            <p className="text-xs text-muted-foreground">
              Los servicios/combos no descuentan inventario
            </p>
          )}
          {inv.lines.map((line, idx) => (
            <div key={`${inv.legacyKey}-${idx}`} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{line.productName ?? line.description}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{line.productCode}</p>
                <StockSummary line={line} />
              </div>
              <div className="shrink-0 text-right tabular-nums">
                <p>{line.quantity} u.</p>
                <p className="text-xs text-muted-foreground">{formatUsd(line.lineTotal)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceRow({
  inv,
  expanded,
  onToggle,
}: {
  inv: SalesImportInvoicePreview;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <TableCell>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell>{statusBadge(inv.status)}</TableCell>
        <TableCell className="font-mono text-xs">{inv.legacyKey}</TableCell>
        <TableCell>{inv.saleDate}</TableCell>
        <TableCell className="max-w-[140px] truncate">{inv.customer}</TableCell>
        <TableCell className="text-right">{inv.lineCount}</TableCell>
        <TableCell className="text-right">{formatUsd(inv.excelTotal)}</TableCell>
        <TableCell className="text-right">{formatUsd(inv.computedTotal)}</TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/30 p-0">
            {inv.issues.length > 0 && (
              <p className="px-4 pt-3 text-sm text-amber-800 dark:text-amber-200">{inv.issues.join(' · ')}</p>
            )}
            {inv.lines.some((line) => line.stockDelta === 0) && (
              <p className="px-4 pb-2 pt-1 text-xs text-muted-foreground">
                Los servicios/combos no descuentan inventario
              </p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Stock actual</TableHead>
                  <TableHead
                    className="text-right whitespace-nowrap"
                    title="Impacto en inventario tras importar"
                  >
                    Δ stock
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">Stock final</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Match</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inv.lines.map((line, idx) => (
                  <TableRow key={`${inv.legacyKey}-${idx}`}>
                    <TableCell className="font-mono text-xs">{line.productCode}</TableCell>
                    <TableCell>
                      {line.productName ?? line.description}
                      {!line.productId && (
                        <span className="ml-1 text-xs text-destructive">(no encontrado)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <StockValue value={line.currentStock} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <StockDeltaValue value={line.stockDelta} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <StockValue value={line.finalStock} />
                    </TableCell>
                    <TableCell className="text-right">{formatUsd(line.lineTotal)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{line.matchBy ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';
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
  FileSpreadsheet,
  Loader2,
  PackagePlus,
  Upload,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import {
  salesImportService,
  type SalesImportConfirmResult,
  type SalesImportInvoicePreview,
  type SalesImportInvoiceStatus,
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
      return <Badge variant="secondary" className="bg-amber-100 text-amber-900">Advertencia</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    case 'already_imported':
      return <Badge variant="outline">Ya importada</Badge>;
  }
}

export default function SalesImportPage() {
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
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const list = Array.from(incoming).filter(
      (f) => f.name.endsWith('.xls') || f.name.endsWith('.xlsx'),
    );
    if (list.length === 0) {
      toast.error('Solo archivos .xls o .xlsx');
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
    if (inputRef.current) inputRef.current.value = '';
  };

  if (!canManageInventory) {
    return (
      <AdminPageShell eyebrow="Ventas" title="Importar ventas POS">
        <AdminCard>
          <p className="text-sm text-muted-foreground">
            No tienes permisos para importar ventas.
          </p>
        </AdminCard>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Ventas"
      title="Importar ventas POS"
      subtitle="Sube reportes FastReport (.xls) y registra ventas históricas con inventario"
    >
      <div className="space-y-6">
        {/* Ayuda */}
        <AdminCard>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Formatos aceptados: <strong>Reporte General de Ventas</strong> (por día) o{' '}
            <strong>Reporte de Productos Vendidos</strong> (rango de fechas), exportados desde
            FastReport. Los códigos del Excel deben coincidir con el <strong>SKU</strong> en MARFYL.
            Las facturas ya importadas no se duplican.
          </p>
        </AdminCard>

        {/* Dropzone */}
        <AdminCard title="1. Archivos">
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Arrastra archivos o haz clic para seleccionar</p>
              <p className="text-sm text-muted-foreground mt-1">Hasta 10 archivos .xls / .xlsx</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xls,.xlsx"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
              }}
            />
          </div>

          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((f) => (
                <li
                  key={f.name}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 truncate">
                    <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
                    {f.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
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

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={runPreview}
              disabled={!files.length || loading || !selectedCompanyId}
              className="cursor-pointer"
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
              <Button variant="outline" onClick={resetAll} className="cursor-pointer">
                Limpiar
              </Button>
            )}
          </div>
        </AdminCard>

        {error && (
          <AdminCard>
            <div className="flex items-start gap-2 text-destructive text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          </AdminCard>
        )}

        {preview && (
          <>
            {/* Resumen */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {[
                { label: 'Facturas', value: preview.summary.invoices },
                { label: 'Listas', value: preview.summary.ready, className: 'text-emerald-600' },
                { label: 'Advertencias', value: preview.summary.warnings, className: 'text-amber-600' },
                { label: 'Errores', value: preview.summary.errors, className: 'text-destructive' },
                { label: 'Ya importadas', value: preview.summary.alreadyImported },
                { label: 'Líneas', value: preview.summary.lines },
              ].map((card) => (
                <AdminCard key={card.label}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{card.label}</p>
                  <p className={`text-2xl font-semibold mt-1 ${card.className ?? ''}`}>{card.value}</p>
                </AdminCard>
              ))}
            </div>

            {missingProductCount > 0 && (
              <AdminCard>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Productos faltantes en catálogo</p>
                    <p className="text-sm text-muted-foreground">
                      Hay facturas con SKU que no existen en tu inventario. Puedes crearlos
                      automáticamente con nombre y precio del Excel.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={runProvision}
                    disabled={provisioning}
                    className="cursor-pointer shrink-0"
                  >
                    {provisioning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PackagePlus className="mr-2 h-4 w-4" />
                    )}
                    Crear productos faltantes
                  </Button>
                </div>
              </AdminCard>
            )}

            {/* Filtros y opciones */}
            <AdminCard title="2. Revisión">
              <div className="flex flex-wrap gap-2 mb-4">
                {(
                  [
                    ['all', 'Todas'],
                    ['ready', 'Listas'],
                    ['warning', 'Advertencias'],
                    ['error', 'Errores'],
                    ['already_imported', 'Ya importadas'],
                  ] as const
                ).map(([id, label]) => (
                  <Button
                    key={id}
                    size="sm"
                    variant={filter === id ? 'default' : 'outline'}
                    onClick={() => setFilter(id)}
                    className="cursor-pointer"
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {preview.summary.warnings > 0 && (
                <label className="flex items-start gap-2 mb-4 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowWarnings}
                    onChange={(e) => setAllowWarnings(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Importar facturas con diferencia de IVA (usar total del POS legacy cuando
                    corresponda)
                  </span>
                </label>
              )}

              <div className="rounded-md border overflow-x-auto">
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
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
              </div>
            </AdminCard>

            {/* Confirmar */}
            <AdminCard title="3. Importar">
              <p className="text-sm text-muted-foreground mb-4">
                Se registrarán <strong>{importableCount}</strong> facturas históricas, se descontará
                inventario y las ya importadas se omitirán.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="lg"
                  disabled={importableCount === 0 || confirming}
                  onClick={() => setConfirmOpen(true)}
                  className="cursor-pointer"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando…
                    </>
                  ) : (
                    `Importar ${importableCount} facturas`
                  )}
                </Button>
                <Button variant="outline" asChild className="cursor-pointer">
                  <Link href="/invoices">Ver facturas</Link>
                </Button>
                <Button variant="outline" asChild className="cursor-pointer">
                  <Link href="/history">Historial de ventas</Link>
                </Button>
              </div>
            </AdminCard>
          </>
        )}

        {confirmResult && (
          <AdminCard>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-medium">Importación completada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Importadas: {confirmResult.imported} · Fallidas: {confirmResult.failed}
                </p>
                {confirmResult.errors.length > 0 && (
                  <ul className="mt-2 text-sm text-destructive space-y-1">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar importación</DialogTitle>
            <DialogDescription>
              Vas a importar {importableCount} facturas de ventas históricas. Esta acción registra
              facturas pagadas, descuenta stock y no se puede deshacer fácilmente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={runConfirm} disabled={confirming}>
              Confirmar importación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
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
              <p className="px-4 pt-3 text-sm text-amber-800">{inv.issues.join(' · ')}</p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
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
                        <span className="text-destructive text-xs ml-1">(no encontrado)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right">{formatUsd(line.lineTotal)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {line.matchBy ?? '—'}
                    </TableCell>
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

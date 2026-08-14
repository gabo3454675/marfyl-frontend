'use client';

import { useState } from 'react';
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
import { Download, Loader2 } from 'lucide-react';
import {
  purchasesImportService,
  type PurchasesImportConfirmResult,
  type PurchasesImportPreviewResult,
} from '@/lib/api/purchases-import';
import { toast } from 'sonner';
import apiClient from '@/lib/api';

function formatUsd(n: number) {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

function isExcel(name: string) {
  const n = name.toLowerCase();
  return n.endsWith('.xlsx') || n.endsWith('.xls');
}

export function ExcelPurchasesPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PurchasesImportPreviewResult | null>(null);
  const [result, setResult] = useState<PurchasesImportConfirmResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      const res = await apiClient.get('/purchases-import/template', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MARFYL-plantilla-COMPRAS.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo descargar la plantilla');
    } finally {
      setDownloading(false);
    }
  };

  const pickFile = (files: File[]) => {
    const next = files[0];
    if (!next || !isExcel(next.name)) {
      toast.error('Usa la plantilla de compras (.xls o .xlsx)');
      return;
    }
    setFile(next);
    setPreview(null);
    setResult(null);
  };

  const runPreview = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await purchasesImportService.preview(file);
      setPreview(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al analizar archivo');
    } finally {
      setLoading(false);
    }
  };

  const runConfirm = async () => {
    if (!file) return;
    setConfirming(true);
    try {
      const data = await purchasesImportService.confirm(file, true);
      setResult(data);
      toast.success(`${data.expensesCreated} compras registradas`);
      await runPreview();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al importar compras');
    } finally {
      setConfirming(false);
    }
  };

  const newGroups = preview?.groups.filter((g) => !g.alreadyImported).length ?? 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Llénala en USD. Se crea el gasto, entra el stock y se actualiza costo. Las ya importadas se
            omiten.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={downloadTemplate}
            disabled={downloading}
            className="h-11 w-full shrink-0 sm:w-auto"
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

      <AdminCard title="1. Archivo">
        <ImportDropzone
          accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hint="Un Excel .xls / .xlsx"
          files={file ? [file] : []}
          onFiles={pickFile}
        />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button type="button" disabled={!file || loading} onClick={runPreview} className="h-11 w-full sm:w-auto">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analizar
          </Button>
          {file && (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:w-auto"
              onClick={() => {
                setFile(null);
                setPreview(null);
                setResult(null);
              }}
            >
              Limpiar
            </Button>
          )}
        </div>
      </AdminCard>

      {preview && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Facturas', value: preview.groups.length },
              { label: 'Líneas', value: preview.totalLines },
              { label: 'Total USD', value: formatUsd(preview.totalAmountUsd) },
              { label: 'Nuevos', value: preview.productsToCreate },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-border/70 bg-card/70 px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">{card.value}</p>
              </div>
            ))}
          </div>

          <AdminCard title="2. Revisión">
            <div className="space-y-3">
              {preview.groups.map((g) => (
                <div key={g.groupIndex} className="rounded-2xl border border-border/70 p-3 sm:p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{g.supplierName}</span>
                    <Badge variant="outline">{g.purchaseDate}</Badge>
                    <Badge variant="secondary">{g.invoiceRef}</Badge>
                    <span className="text-sm tabular-nums">{formatUsd(g.totalUsd)}</span>
                    {g.alreadyImported && <Badge className="bg-slate-600">Ya importada</Badge>}
                  </div>
                  <div className="space-y-2 md:hidden">
                    {g.lines.map((l) => (
                      <div key={l.rowNum} className="flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{l.productName ?? l.description}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{l.sku}</p>
                        </div>
                        <div className="shrink-0 text-right tabular-nums">
                          <p>{l.quantity} u.</p>
                          <p className="text-xs text-muted-foreground">{formatUsd(l.unitCostUsd)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <AdminTableWrap className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Cant.</TableHead>
                          <TableHead className="text-right">Costo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {g.lines.map((l) => (
                          <TableRow key={l.rowNum}>
                            <TableCell className="font-mono text-xs">{l.sku}</TableCell>
                            <TableCell>
                              {l.productName ?? l.description}
                              {l.willCreate && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Nuevo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{l.quantity}</TableCell>
                            <TableCell className="text-right">{formatUsd(l.unitCostUsd)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AdminTableWrap>
                </div>
              ))}
            </div>
          </AdminCard>

          <div className="sticky bottom-[calc(var(--app-bottom-chrome)+0.5rem)] z-20 rounded-2xl border border-border/80 bg-background/95 p-3 shadow-lg backdrop-blur-md md:bottom-4 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {newGroups} compra{newGroups === 1 ? '' : 's'} nueva{newGroups === 1 ? '' : 's'} para
                registrar.
              </p>
              <Button
                type="button"
                disabled={!file || newGroups === 0 || confirming}
                onClick={runConfirm}
                className="h-12 w-full sm:w-auto"
              >
                {confirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar importación
              </Button>
            </div>
          </div>
        </>
      )}

      {result && (
        <AdminCard title="Listo">
          <p className="text-sm leading-relaxed">
            {result.expensesCreated} compras creadas, {result.expensesSkipped} omitidas,{' '}
            {result.stockAdded} unidades en stock, {formatUsd(result.totalAmountUsd)} total.
          </p>
        </AdminCard>
      )}
    </div>
  );
}

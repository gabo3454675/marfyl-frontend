'use client';

import { useRef, useState } from 'react';
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
import { FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import {
  purchasesImportService,
  type PurchasesImportConfirmResult,
  type PurchasesImportPreviewResult,
} from '@/lib/api/purchases-import';
import { toast } from 'sonner';

function formatUsd(n: number) {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

export default function PurchasesImportPage() {
  const { canManageInventory } = usePermission();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PurchasesImportPreviewResult | null>(null);
  const [result, setResult] = useState<PurchasesImportConfirmResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

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

  if (!canManageInventory) {
    return (
      <AdminPageShell eyebrow="Inventario" title="Importar compras">
        <AdminCard>
          <p className="text-sm text-muted-foreground">Sin permisos para importar compras.</p>
        </AdminCard>
      </AdminPageShell>
    );
  }

  const newGroups =
    preview?.groups.filter((g) => !g.alreadyImported).length ?? 0;

  return (
    <AdminPageShell
      eyebrow="Inventario"
      title="Importar compras Monddy"
      subtitle="Excel formato COMPRAS (MES, FECHA, FACTURA, PROVEEDOR, SKU, COSTO...)"
    >
      <div className="space-y-6">
        <AdminCard>
          <p className="text-sm text-muted-foreground mb-4">
            Montos en <strong>USD</strong>. Se crean gastos de inventario, movimientos de stock y
            actualiza costo/precio de catálogo. Compras ya importadas se omiten automáticamente.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFile(f ?? null);
              setPreview(null);
              setResult(null);
            }}
          />
          <div className="flex flex-wrap gap-3 items-center">
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Elegir Excel
            </Button>
            {file && (
              <span className="text-sm flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                {file.name}
              </span>
            )}
            <Button type="button" disabled={!file || loading} onClick={runPreview}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Analizar
            </Button>
            <Button
              type="button"
              disabled={!file || !preview || newGroups === 0 || confirming}
              onClick={runConfirm}
            >
              {confirming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar importación
            </Button>
          </div>
        </AdminCard>

        {preview && (
          <AdminCard title="Vista previa">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-sm">
              <div>
                <p className="text-muted-foreground">Facturas</p>
                <p className="text-lg font-semibold">{preview.groups.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Líneas</p>
                <p className="text-lg font-semibold">{preview.totalLines}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total USD</p>
                <p className="text-lg font-semibold">{formatUsd(preview.totalAmountUsd)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Productos nuevos</p>
                <p className="text-lg font-semibold">{preview.productsToCreate}</p>
              </div>
            </div>
            <div className="space-y-4 max-h-[420px] overflow-y-auto">
              {preview.groups.map((g) => (
                <div key={g.groupIndex} className="border rounded-lg p-3">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-medium">{g.supplierName}</span>
                    <Badge variant="outline">{g.purchaseDate}</Badge>
                    <Badge variant="secondary">{g.invoiceRef}</Badge>
                    <span className="text-sm">{formatUsd(g.totalUsd)}</span>
                    {g.alreadyImported && (
                      <Badge className="bg-slate-600">Ya importada</Badge>
                    )}
                  </div>
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
                          <TableCell className="text-right">
                            {formatUsd(l.unitCostUsd)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </AdminCard>
        )}

        {result && (
          <AdminCard title="Resultado">
            <p className="text-sm">
              {result.expensesCreated} compras creadas, {result.expensesSkipped} omitidas,{' '}
              {result.stockAdded} unidades en stock, {formatUsd(result.totalAmountUsd)} total.
            </p>
          </AdminCard>
        )}
      </div>
    </AdminPageShell>
  );
}

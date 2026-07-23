'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
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
import { Badge } from '@/components/ui/badge';
import { AdminCard } from '@/components/admin/admin-card';
import { ImportPreviewShell } from '@/components/import';
import {
  invoiceUploadService,
  type InvoiceConfirmResult,
  type InvoicePreviewResult,
} from '@/lib/api/invoice-upload';
import type { Supplier } from '@/lib/api/suppliers';
import { formatCurrency } from '../helpers';

type InvoiceFileImportTabProps = {
  suppliers: Supplier[];
  onOpenSupplierDialog: () => void;
  onImportSuccess?: (result: InvoiceConfirmResult) => void;
};

export default function InvoiceFileImportTab({
  suppliers,
  onOpenSupplierDialog,
  onImportSuccess,
}: InvoiceFileImportTabProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [preview, setPreview] = useState<InvoicePreviewResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<InvoiceConfirmResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runPreview = async (file: File) => {
    setSubmitting(true);
    setPreview(null);
    setError(null);
    setResult(null);
    try {
      const supplier = supplierId ? parseInt(supplierId, 10) : undefined;
      const data = await invoiceUploadService.preview(file, supplier);
      setPreview(data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al leer el archivo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = async (file: File | null) => {
    setImportFile(file);
    setPreview(null);
    setResult(null);
    setError(null);
    if (file) await runPreview(file);
  };

  const handleConfirm = async () => {
    if (!preview?.canConfirm) return;

    const matchedLines = preview.lines.filter(
      (line) => line.status === 'matched' && line.productId != null,
    );
    if (matchedLines.length === 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const data = await invoiceUploadService.confirm({
        lines: matchedLines.map((line) => ({
          productId: line.productId!,
          quantity: line.quantity,
          unitCostUsd: line.unitCost,
          originalName: line.originalName,
        })),
        supplierId: supplierId ? parseInt(supplierId, 10) : undefined,
        date,
        referenceNumber: referenceNumber || undefined,
        description: `Compra de inventario - ${matchedLines.length} productos (archivo)`,
        createExpense: true,
      });
      setResult(data);
      setImportFile(null);
      setPreview(null);
      onImportSuccess?.(data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al registrar la compra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setImportFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setSupplierId('');
    setDate(new Date().toISOString().split('T')[0]);
    setReferenceNumber('');
  };

  return (
    <TabsContent value="import" className="space-y-4">
      {result ? (
        <AdminCard>
          <div className="space-y-4">
            <p className="text-lg font-semibold">Compra registrada exitosamente</p>
            <p className="text-sm text-muted-foreground">
              Se crearon {result.movementsCreated} movimientos y se actualizaron{' '}
              {result.productsUpdated} productos.
            </p>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="text-sm font-medium">Total de la compra</span>
              <span className="text-lg font-bold">{formatCurrency(result.totalAmount)}</span>
            </div>
            <Button variant="outline" className="cursor-pointer" onClick={handleReset}>
              Importar otro archivo
            </Button>
          </div>
        </AdminCard>
      ) : (
        <AdminCard
          title={
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar factura de compra
            </span>
          }
          description="Sube un Excel (.xlsx, .xls) o PDF con código/SKU, cantidad y costo unitario. Revisa la vista previa antes de confirmar."
        >
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Archivo (.xlsx, .xls o .pdf)</Label>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf"
                  onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Proveedor (opcional)</Label>
                {suppliers.length === 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onOpenSupplierDialog}
                    className="cursor-pointer"
                  >
                    Agregar proveedor
                  </Button>
                ) : (
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Referencia (opcional)</Label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="N° factura o referencia"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="cursor-pointer"
                disabled={submitting || !importFile}
                onClick={() => importFile && void runPreview(importFile)}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Vista previa
              </Button>
              <Button
                type="button"
                className="cursor-pointer"
                disabled={submitting || !preview?.canConfirm}
                onClick={() => void handleConfirm()}
              >
                Registrar compra
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {preview && (
              <ImportPreviewShell
                canConfirm={preview.canConfirm}
                summary={
                  <div className="space-y-1">
                    <p className="font-semibold">
                      Total estimado: {formatCurrency(preview.totalAmount)}
                    </p>
                    <p className="text-muted-foreground font-normal">
                      {preview.matchedLines} líneas reconocidas · {preview.unmatchedLines} sin
                      coincidencia
                    </p>
                  </div>
                }
                errors={preview.errors}
                unmatched={preview.unmatched}
              >
                {preview.lines.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">Costo u.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.lines.map((line) => (
                        <TableRow key={line.lineIndex}>
                          <TableCell className="font-mono text-xs">{line.originalCode}</TableCell>
                          <TableCell>
                            {line.productName || line.originalName || '—'}
                            {line.productSku ? (
                              <span className="block text-xs text-muted-foreground">
                                SKU: {line.productSku}
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right">{line.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(line.unitCost)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(line.lineTotal)}
                          </TableCell>
                          <TableCell>
                            {line.status === 'matched' ? (
                              <Badge variant="default">OK</Badge>
                            ) : (
                              <Badge variant="destructive" title={line.error}>
                                {line.status === 'unmatched' ? 'Sin match' : 'Error'}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : null}
              </ImportPreviewShell>
            )}
          </div>
        </AdminCard>
      )}
    </TabsContent>
  );
}

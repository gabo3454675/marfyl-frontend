'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Loader2 } from 'lucide-react';
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
import { ImportDropzone, ImportPreviewShell } from '@/components/import';
import {
  invoiceUploadService,
  type InvoiceConfirmResult,
  type InvoicePreviewResult,
} from '@/lib/api/invoice-upload';
import type { Supplier } from '@/lib/api/suppliers';
import { formatCurrency } from '../helpers';
import { toast } from 'sonner';

type InvoiceFileImportTabProps = {
  suppliers: Supplier[];
  onOpenSupplierDialog: () => void;
  onImportSuccess?: (result: InvoiceConfirmResult) => void;
};

function fileKind(file: File): 'pdf' | 'excel' | 'image' | 'other' {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (name.endsWith('.pdf') || type === 'application/pdf') return 'pdf';
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || type.includes('spreadsheet') || type.includes('excel')) {
    return 'excel';
  }
  if (type.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/.test(name)) return 'image';
  return 'other';
}

export default function InvoiceFileImportTab({
  suppliers,
  onOpenSupplierDialog,
  onImportSuccess,
}: InvoiceFileImportTabProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [fileHint, setFileHint] = useState<string | null>(null);
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
      if (data.issueDate && /^\d{4}-\d{2}-\d{2}/.test(data.issueDate)) {
        setDate(data.issueDate.slice(0, 10));
      }
      if (data.documentNumber) {
        setReferenceNumber((prev) => prev || data.documentNumber || '');
      }
      if (data.suggestedSupplierId) {
        setSupplierId(String(data.suggestedSupplierId));
      }
      if (data.vendorName) {
        toast.message('Factura leída', {
          description: data.vendorName + (data.warnings?.[0] ? ` · ${data.warnings[0]}` : ''),
        });
      } else if (data.warnings?.length) {
        toast.message('Revisa lo que se leyó', {
          description: data.warnings.slice(0, 2).join(' · '),
        });
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al leer el archivo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const kind = fileKind(file);
    setPreview(null);
    setResult(null);
    setError(null);

    if (kind === 'excel') {
      setImportFile(null);
      setFileHint('excel');
      toast.message('El Excel de compras va en Importar Excel', {
        description: 'Ahí está la plantilla MARFYL. Esta pestaña es foto, PDF o a mano.',
      });
      return;
    }
    if (kind !== 'pdf' && kind !== 'image') {
      setImportFile(null);
      setFileHint('other');
      toast.error('Sube una foto JPEG/PNG o un PDF de la factura');
      return;
    }

    setFileHint(null);
    setImportFile(file);
    void runPreview(file);
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
    setFileHint(null);
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
            <p className="text-lg font-semibold">Compra registrada</p>
            <p className="text-sm text-muted-foreground">
              Se crearon {result.movementsCreated} movimientos y se actualizaron {result.productsUpdated}{' '}
              productos.
            </p>
            <div className="flex items-center justify-between rounded-xl bg-muted p-3">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-bold tabular-nums">{formatCurrency(result.totalAmount)}</span>
            </div>
            <Button variant="outline" className="h-11 w-full cursor-pointer sm:w-auto" onClick={handleReset}>
              Subir otra factura
            </Button>
          </div>
        </AdminCard>
      ) : (
        <AdminCard
          title={
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Factura (foto o PDF)
            </span>
          }
          description="Foto nítida, PDF del proveedor o PDF escaneado. El Excel de compras va en su propia pantalla. Revisa cantidades antes de registrar."
        >
          <div className="space-y-5">
            <ImportDropzone
              accept="application/pdf,.pdf,image/jpeg,image/png,image/webp,image/*"
              allowCamera
              hint="Foto, PDF o archivo. En el celular puedes tomar la foto aquí."
              files={importFile ? [importFile] : []}
              onFiles={handleFiles}
            />

            {fileHint === 'excel' && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Ese archivo es Excel.{' '}
                <Link href="/importar?tipo=compras" className="font-medium text-primary underline-offset-4 hover:underline">
                  Abrir importación de compras
                </Link>
              </p>
            )}
            {fileHint === 'image' && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Usa JPEG o PNG. Si el iPhone guarda HEIC, cambia a «Más compatible».
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Proveedor (opcional)</Label>
                {suppliers.length === 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onOpenSupplierDialog}
                    className="h-11 w-full cursor-pointer"
                  >
                    Agregar proveedor
                  </Button>
                ) : (
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger className="h-11">
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
                <Input
                  type="date"
                  className="h-11"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Referencia (opcional)</Label>
                <Input
                  className="h-11"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="N° factura o referencia"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-full cursor-pointer sm:w-auto"
                disabled={submitting || !importFile}
                onClick={() => importFile && void runPreview(importFile)}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Vista previa
              </Button>
              <Button
                type="button"
                className="h-11 w-full cursor-pointer sm:w-auto"
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
                    <p className="font-semibold">Total estimado: {formatCurrency(preview.totalAmount)}</p>
                    <p className="font-normal text-muted-foreground">
                      {preview.matchedLines} reconocidas · {preview.unmatchedLines} sin coincidencia
                    </p>
                  </div>
                }
                errors={preview.errors}
                unmatched={preview.unmatched}
              >
                {preview.lines.length > 0 ? (
                  <>
                    <div className="space-y-2 md:hidden">
                      {preview.lines.map((line) => (
                        <div
                          key={line.lineIndex}
                          className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-3 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {line.productName || line.originalName || '—'}
                            </p>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {line.originalCode || 'sin código'}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="tabular-nums">{formatCurrency(line.lineTotal)}</p>
                            {line.status === 'matched' ? (
                              <Badge variant="default" className="mt-1">
                                OK
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="mt-1">
                                {line.status === 'unmatched' ? 'Sin match' : 'Error'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="hidden md:block">
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
                              <TableCell className="text-right">{formatCurrency(line.unitCost)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(line.lineTotal)}</TableCell>
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
                    </div>
                  </>
                ) : null}
              </ImportPreviewShell>
            )}
          </div>
        </AdminCard>
      )}
    </TabsContent>
  );
}

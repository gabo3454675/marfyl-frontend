'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, DollarSign } from 'lucide-react';
import { type InvoiceHistoryDetail } from '@/lib/api/invoice-upload';
import { formatCurrency, formatDate } from '../helpers';

interface InvoiceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  target: InvoiceHistoryDetail | null;
  onPay: (detail: InvoiceHistoryDetail) => void;
}

export function InvoiceDetailsDialog({ open, onOpenChange, loading, target, onPay }: InvoiceDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-lg p-0 max-h-[90dvh] flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
          <DialogTitle>Detalles de la Importación</DialogTitle>
          <DialogDescription>
            {target?.supplier?.name || target?.category?.name || '—'} · {target ? formatDate(target.date) : ''}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando detalles…</p>
          </div>
        ) : target ? (
          <div className="overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 text-sm">
            {/* General info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground text-xs">Descripción</span>
                <p className="font-medium break-words">{target.description}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Estado</span>
                <p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    target.status === 'PAID'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {target.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Categoría</span>
                <p className="font-medium">{target.category?.name || '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Referencia</span>
                <p className="font-medium">{target.referenceNumber || '—'}</p>
              </div>
              {target.supplierInvoiceNumber && (
                <div>
                  <span className="text-muted-foreground text-xs">No. Factura</span>
                  <p className="font-medium">{target.supplierInvoiceNumber}</p>
                </div>
              )}
              {target.supplierControlNumber && (
                <div>
                  <span className="text-muted-foreground text-xs">No. Control</span>
                  <p className="font-medium">{target.supplierControlNumber}</p>
                </div>
              )}
            </div>

            {/* Supplier */}
            {target.supplier && (
              <div className="border rounded-lg p-3 space-y-1">
                <span className="text-muted-foreground text-xs">Proveedor</span>
                <p className="font-medium">{target.supplier.name}</p>
                {target.supplier.taxId && (
                  <p className="text-xs text-muted-foreground">RIF: {target.supplier.taxId}</p>
                )}
              </div>
            )}

            {/* Products */}
            {target.products.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2">
                <span className="text-muted-foreground text-xs font-medium">Productos ({target.products.length})</span>
                <div className="overflow-x-auto -mx-1 px-1">
                  <Table className="min-w-[380px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Producto</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">SKU</TableHead>
                        <TableHead className="text-xs text-right">Cant.</TableHead>
                        <TableHead className="text-xs text-right">Costo</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {target.products.map((p) => (
                        <TableRow key={p.productId}>
                          <TableCell className="text-xs font-medium">{p.productName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{p.productSku || '—'}</TableCell>
                          <TableCell className="text-xs text-right">{p.quantity}</TableCell>
                          <TableCell className="text-xs text-right">{p.unitCost != null ? formatCurrency(p.unitCost) : '—'}</TableCell>
                          <TableCell className="text-xs text-right font-semibold">{p.total != null ? formatCurrency(p.total) : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total:</span>
                <span className="font-bold">{formatCurrency(target.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pagado:</span>
                <span className="font-medium text-green-500">{formatCurrency(target.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Saldo:</span>
                <span className={`font-medium ${(target.amount - target.amountPaid) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {formatCurrency(target.amount - target.amountPaid)}
                </span>
              </div>
            </div>

            {/* Payments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">
                  Pagos {target.payments.length > 0 ? `(${target.payments.length})` : ''}
                </span>
                {target.amount - target.amountPaid > 0.01 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs cursor-pointer"
                    onClick={() => onPay(target)}
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    Abonar
                  </Button>
                )}
              </div>
              {target.payments.length > 0 ? (
                <div className="space-y-1">
                  {target.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-3 py-1.5">
                      <span className="text-muted-foreground">{new Date(p.paidAt).toLocaleDateString('es-VE')}</span>
                      <span className="font-medium">{formatCurrency(p.amount)}</span>
                      {p.notes && <span className="text-muted-foreground italic text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-[120px]">{p.notes}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Sin abonos registrados</p>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

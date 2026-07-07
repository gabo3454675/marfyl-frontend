'use client';

import { Loader2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ImportPreviewShell } from '@/components/import';
import type { InventoryImportPreviewResult } from '@/lib/api/inventory';

type InventoryImportPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string | null;
  preview: InventoryImportPreviewResult | null;
  confirming: boolean;
  onConfirm: () => void;
};

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function InventoryImportPreviewDialog({
  open,
  onOpenChange,
  fileName,
  preview,
  confirming,
  onConfirm,
}: InventoryImportPreviewDialogProps) {
  const canConfirm =
    !!preview && preview.errors.length === 0 && preview.preview.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vista previa de importación</DialogTitle>
          <DialogDescription>
            {fileName
              ? `Revisa los datos detectados en "${fileName}" antes de confirmar.`
              : 'Revisa los datos detectados antes de confirmar.'}
          </DialogDescription>
        </DialogHeader>

        {preview ? (
          <ImportPreviewShell
            className="border-0 p-0"
            canConfirm={canConfirm}
            confirmBlockedMessage="Corrija los errores antes de confirmar"
            summary={
              <div className="flex flex-wrap items-center gap-3 font-semibold">
                <span>
                  <span className="text-green-600">{preview.summary.toCreate}</span> por crear
                </span>
                <span className="text-muted-foreground font-normal">·</span>
                <span>
                  <span className="text-blue-600">{preview.summary.toUpdate}</span> por actualizar
                </span>
              </div>
            }
            errors={preview.errors}
          >
            {preview.preview.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Fila</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">P. venta</TableHead>
                    <TableHead className="text-right">Ganancia</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Exento</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.preview.map((row) => (
                    <TableRow key={`${row.rowNumber}-${row.sku}`}>
                      <TableCell className="text-muted-foreground">{row.rowNumber}</TableCell>
                      <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="text-right">{formatPrice(row.costPrice)}</TableCell>
                      <TableCell className="text-right">{formatPrice(row.salePrice)}</TableCell>
                      <TableCell className="text-right">{formatPrice(row.profit)}</TableCell>
                      <TableCell className="text-right">{row.stock}</TableCell>
                      <TableCell>{row.isExempt ? 'Sí' : 'No'}</TableCell>
                      <TableCell>
                        <Badge variant={row.action === 'create' ? 'default' : 'secondary'}>
                          {row.action === 'create' ? 'Crear' : 'Actualizar'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </ImportPreviewShell>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Analizando archivo...
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={confirming}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm} disabled={!canConfirm || confirming}>
            {confirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              'Confirmar importación'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

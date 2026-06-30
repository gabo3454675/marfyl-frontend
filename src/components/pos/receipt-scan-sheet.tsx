'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, ScanLine, Upload } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { receiptScanService, type ScannedReceiptResult } from '@/lib/api/receipt-scan';
import { toast } from 'sonner';

type CategoryOption = { id: number; name: string };

type ReceiptScanSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  onConfirmed?: () => void;
};

export function ReceiptScanSheet({
  open,
  onOpenChange,
  categories,
  onConfirmed,
}: ReceiptScanSheetProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [scan, setScan] = useState<ScannedReceiptResult | null>(null);
  const [mode, setMode] = useState<'inventory' | 'expense'>('inventory');
  const [categoryId, setCategoryId] = useState<string>('');

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setScanning(true);
    setScan(null);
    try {
      const result = await receiptScanService.scan(file);
      setScan(result);
      if (result.warnings?.length) {
        toast.message('Revisa los datos detectados', {
          description: result.warnings.slice(0, 2).join(' · '),
        });
      }
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'No se pudo leer la factura');
    } finally {
      setScanning(false);
    }
  };

  const handleConfirm = async () => {
    if (!scan?.lines.length) {
      toast.error('No hay líneas para registrar');
      return;
    }
    if (!categoryId) {
      toast.error('Seleccione una categoría');
      return;
    }
    setConfirming(true);
    try {
      await receiptScanService.confirm({
        mode,
        scan,
        categoryId: parseInt(categoryId, 10),
      });
      toast.success(
        mode === 'inventory'
          ? 'Compra registrada e inventario actualizado'
          : 'Gasto operativo registrado',
      );
      setScan(null);
      onOpenChange(false);
      onConfirmed?.();
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Error al registrar');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[min(92dvh,720px)] overflow-y-auto rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-5 w-5 text-primary" />
            Escanear factura (foto)
          </SheetTitle>
        </SheetHeader>
        <p className="mt-1 text-sm text-muted-foreground">
          Toma una foto del recibo o factura de compra. MARFYL detecta productos, montos y proveedor.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="default"
            className="min-h-[44px] flex-1 touch-manipulation gap-2"
            disabled={scanning}
            onClick={() => inputRef.current?.click()}
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            Tomar foto
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] flex-1 touch-manipulation gap-2"
            disabled={scanning}
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.removeAttribute('capture');
                inputRef.current.click();
                inputRef.current.setAttribute('capture', 'environment');
              }
            }}
          >
            <Upload className="h-4 w-4" />
            Galería
          </Button>
        </div>

        {scan ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm">
              {scan.vendorName ? <p className="font-medium">{scan.vendorName}</p> : null}
              {scan.documentNumber ? (
                <p className="text-muted-foreground">Doc: {scan.documentNumber}</p>
              ) : null}
              {scan.totalUsd != null ? (
                <p className="tabular-nums font-semibold text-primary">
                  Ref. ${scan.totalUsd.toFixed(2)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Tipo de registro</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as 'inventory' | 'expense')}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">Compra → Inventario</SelectItem>
                  <SelectItem value="expense">Gasto operativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-[28dvh] space-y-2 overflow-y-auto rounded-lg border border-border/60 p-2">
              {scan.lines.map((line, i) => (
                <div
                  key={`${line.name}-${i}`}
                  className="flex items-start justify-between gap-2 border-b border-border/40 pb-2 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.name}</p>
                    <p className="text-xs text-muted-foreground">
                      x{line.quantity}
                      {line.unitCostUsd != null ? ` · $${line.unitCostUsd.toFixed(2)} c/u` : ''}
                    </p>
                  </div>
                  <Badge variant={line.action === 'match' ? 'secondary' : 'outline'} className="shrink-0 text-[10px]">
                    {line.action === 'match' ? 'Existe' : 'Nuevo'}
                  </Badge>
                </div>
              ))}
            </div>

            <Button
              type="button"
              className="h-12 w-full touch-manipulation font-semibold"
              disabled={confirming}
              onClick={() => void handleConfirm()}
            >
              {confirming ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar registro'}
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

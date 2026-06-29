'use client';

import { useState } from 'react';
import { PackagePlus, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

export type QuickProductResult = {
  id: number;
  name: string;
  salePrice: number;
  costPrice: number;
  stock: number;
  sku?: string | null;
  isExempt?: boolean;
};

type QuickProductSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (product: QuickProductResult, quantity: number) => void;
};

export function QuickProductSheet({ open, onOpenChange, onCreated }: QuickProductSheetProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sku, setSku] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setQuantity('1');
    setSalePrice('');
    setCostPrice('');
    setSku('');
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const price = parseFloat(salePrice);
    const cost = parseFloat(costPrice) || 0;
    if (!trimmed) {
      toast.error('Indique el nombre del producto');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Precio de venta inválido');
      return;
    }
    setSaving(true);
    try {
      const res = await apiClient.post<QuickProductResult>('/products', {
        name: trimmed,
        salePrice: price,
        costPrice: cost,
        stock: qty,
        sku: sku.trim() || undefined,
      });
      toast.success('Producto registrado en catálogo');
      onCreated(res.data, qty);
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'No se pudo crear el producto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[min(90dvh,640px)] overflow-y-auto rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <PackagePlus className="h-5 w-5 text-primary" />
            Producto rápido
          </SheetTitle>
        </SheetHeader>
        <p className="mt-1 text-sm text-muted-foreground">
          Se crea en el catálogo y se agrega al carrito. Al cobrar, el inventario se actualiza solo.
        </p>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qp-name">Nombre *</Label>
            <Input
              id="qp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Harina PAN 1kg x20"
              className="min-h-[44px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qp-qty">Cantidad</Label>
              <Input
                id="qp-qty"
                type="number"
                min={1}
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qp-sku">SKU (opcional)</Label>
              <Input
                id="qp-sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qp-price">Precio venta (USD) *</Label>
              <Input
                id="qp-price"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qp-cost">Costo (USD)</Label>
              <Input
                id="qp-cost"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
          </div>
          <Button
            type="button"
            className="h-12 w-full touch-manipulation text-base font-semibold"
            disabled={saving}
            onClick={() => void handleSubmit()}
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Crear y agregar al carrito'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { ProductVariant, CreateVariantPayload } from '@/types/product-variant';

export interface VariantFormValues {
  name: string;
  salePrice: string;
  unitQuantity: string;
  stockBehavior: 'DEDUCT' | 'NO_DEDUCT';
  inheritCost: boolean;
  costPrice: string;
  isDefault: boolean;
  sortOrder: string;
}

interface VariantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Variante existente para editar; null/undefined para crear nueva */
  variant: ProductVariant | null;
  /** Próximo orden sugerido para nueva variante */
  nextSortOrder: number;
  /** Se llama al enviar el formulario con los datos limpios */
  onSubmit: (data: CreateVariantPayload) => Promise<void>;
}

function getInitialValues(
  variant: ProductVariant | null,
  nextSortOrder: number
): VariantFormValues {
  if (variant) {
    return {
      name: variant.name,
      salePrice: String(variant.salePrice),
      unitQuantity: String(variant.unitQuantity),
      stockBehavior: variant.stockBehavior,
      inheritCost: variant.inheritCost,
      costPrice: variant.costPrice != null ? String(variant.costPrice) : '',
      isDefault: variant.isDefault,
      sortOrder: String(variant.sortOrder),
    };
  }
  return {
    name: '',
    salePrice: '',
    unitQuantity: '1',
    stockBehavior: 'DEDUCT' as const,
    inheritCost: true,
    costPrice: '',
    isDefault: false,
    sortOrder: String(nextSortOrder),
  };
}

export function VariantForm({
  open,
  onOpenChange,
  variant,
  nextSortOrder,
  onSubmit,
}: VariantFormProps) {
  const isEditing = variant !== null;
  const [form, setForm] = useState<VariantFormValues>(() =>
    getInitialValues(variant, nextSortOrder)
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof VariantFormValues, string>>>({});

  // Reset form when dialog opens/closes or variant changes
  useEffect(() => {
    if (open) {
      setForm(getInitialValues(variant, nextSortOrder));
      setErrors({});
    }
  }, [open, variant, nextSortOrder]);

  const set = <K extends keyof VariantFormValues>(
    key: K,
    value: VariantFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error on change
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VariantFormValues, string>> = {};
    if (!form.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    const price = parseFloat(form.salePrice);
    if (!form.salePrice || !Number.isFinite(price) || price <= 0) {
      newErrors.salePrice = 'Ingrese un precio de venta válido';
    }
    const qty = parseInt(form.unitQuantity, 10);
    if (!form.unitQuantity || !Number.isFinite(qty) || qty < 1) {
      newErrors.unitQuantity = 'Debe ser al menos 1';
    }
    if (!form.inheritCost && form.costPrice) {
      const cost = parseFloat(form.costPrice);
      if (!Number.isFinite(cost) || cost < 0) {
        newErrors.costPrice = 'Costo inválido';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: CreateVariantPayload = {
        name: form.name.trim(),
        salePrice: parseFloat(form.salePrice),
        unitQuantity: parseInt(form.unitQuantity, 10) || 1,
        stockBehavior: form.stockBehavior,
        inheritCost: form.inheritCost,
        costPrice: form.inheritCost
          ? null
          : form.costPrice
            ? parseFloat(form.costPrice)
            : null,
        isDefault: form.isDefault,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
      };
      await onSubmit(payload);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar variante' : 'Nueva variante'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos de la presentación del producto.'
              : 'Agrega una nueva presentación al producto (talla, empaque, etc.).'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Nombre */}
          <div className="grid gap-2">
            <Label htmlFor="vf-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="vf-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej. BOTELLA SOLA, TOBO NORMAL"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Precio + Unidades */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="vf-salePrice">
                Precio de venta <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vf-salePrice"
                type="number"
                step="0.01"
                min="0"
                value={form.salePrice}
                onChange={(e) => set('salePrice', e.target.value)}
                className={errors.salePrice ? 'border-destructive' : ''}
              />
              {errors.salePrice && (
                <p className="text-xs text-destructive">{errors.salePrice}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vf-unitQuantity">Unidades/paquete</Label>
              <Input
                id="vf-unitQuantity"
                type="number"
                min="1"
                value={form.unitQuantity}
                onChange={(e) => set('unitQuantity', e.target.value)}
                className={errors.unitQuantity ? 'border-destructive' : ''}
              />
              {errors.unitQuantity && (
                <p className="text-xs text-destructive">{errors.unitQuantity}</p>
              )}
            </div>
          </div>

          {/* Comportamiento de stock */}
          <div className="grid gap-2">
            <Label htmlFor="vf-stockBehavior">Comportamiento de stock</Label>
            <Select
              value={form.stockBehavior}
              onValueChange={(val: 'DEDUCT' | 'NO_DEDUCT') =>
                set('stockBehavior', val)
              }
            >
              <SelectTrigger id="vf-stockBehavior">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEDUCT">Descontar del inventario</SelectItem>
                <SelectItem value="NO_DEDUCT">No descontar</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Controla si la venta de esta variante descuenta del stock del producto.
            </p>
          </div>

          <Separator />

          {/* Costo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="vf-inheritCost" className="cursor-pointer">
                Heredar costo del producto
              </Label>
              <Switch
                id="vf-inheritCost"
                checked={form.inheritCost}
                onCheckedChange={(checked) => set('inheritCost', checked)}
              />
            </div>

            {!form.inheritCost && (
              <div className="grid gap-2">
                <Label htmlFor="vf-costPrice">Costo personalizado</Label>
                <Input
                  id="vf-costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.costPrice}
                  onChange={(e) => set('costPrice', e.target.value)}
                  className={errors.costPrice ? 'border-destructive' : ''}
                />
                {errors.costPrice && (
                  <p className="text-xs text-destructive">{errors.costPrice}</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Default + Orden */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Switch
                id="vf-isDefault"
                checked={form.isDefault}
                onCheckedChange={(checked) => set('isDefault', checked)}
              />
              <Label htmlFor="vf-isDefault" className="cursor-pointer">
                Variante por defecto
              </Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vf-sortOrder">Orden</Label>
              <Input
                id="vf-sortOrder"
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => set('sortOrder', e.target.value)}
              />
            </div>
          </div>
          {form.isDefault && (
            <p className="text-xs text-muted-foreground">
              Al marcar esta variante como default, se actualizará el precio de
              venta del producto.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : isEditing ? (
              'Guardar cambios'
            ) : (
              'Crear variante'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

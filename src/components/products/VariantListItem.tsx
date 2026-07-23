'use client';

import { ArrowUp, ArrowDown, Edit, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { ProductVariant } from '@/types/product-variant';

interface VariantListItemProps {
  variant: ProductVariant;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (variant: ProductVariant) => void;
  onDelete: (variant: ProductVariant) => void;
  onSetDefault: (variant: ProductVariant) => void;
  onToggleActive: (variant: ProductVariant) => void;
  onMoveUp: (variant: ProductVariant) => void;
  onMoveDown: (variant: ProductVariant) => void;
}

export function VariantListItem({
  variant,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onSetDefault,
  onToggleActive,
  onMoveUp,
  onMoveDown,
}: VariantListItemProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);

  const stockBehaviorLabel =
    variant.stockBehavior === 'DEDUCT' ? 'Desc. stock' : 'Sin desc.';

  return (
    <div
      className={`
        group relative flex flex-col gap-3 rounded-lg border p-4
        transition-colors hover:bg-accent/30
        ${variant.isActive ? 'border-border' : 'border-dashed opacity-60'}
        ${variant.isDefault ? 'ring-1 ring-primary/20' : ''}
      `}
    >
      {/* Fila principal */}
      <div className="flex items-start justify-between gap-3">
        {/* Info izquierda */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium">{variant.name}</span>
            {variant.isDefault && (
              <Badge variant="default" className="gap-1 text-[10px]">
                <Star className="h-3 w-3 fill-current" />
                Default
              </Badge>
            )}
            <Badge
              variant={variant.isActive ? 'secondary' : 'outline'}
              className="text-[10px]"
            >
              {variant.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {stockBehaviorLabel}
            </Badge>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatCurrency(Number(variant.salePrice))}
            </span>
            <span>Ud./paq: {variant.unitQuantity}</span>
            {variant.costPrice != null && !variant.inheritCost && (
              <span>Costo: {formatCurrency(Number(variant.costPrice))}</span>
            )}
            {variant.inheritCost && (
              <span>Hereda costo</span>
            )}
            <span>Orden: {variant.sortOrder}</span>
          </div>
        </div>

        {/* Acciones principales visibles siempre en mobile */}
        <div className="flex shrink-0 items-center gap-0.5">
          {/* Set default — solo si no es default ya */}
          {!variant.isDefault && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => onSetDefault(variant)}
              title="Marcar como default"
            >
              <Star className="h-4 w-4 text-muted-foreground hover:text-amber-500" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => onEdit(variant)}
            title="Editar variante"
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
            onClick={() => onDelete(variant)}
            title="Eliminar variante"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fila inferior: active toggle + reorder */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={variant.isActive}
            onCheckedChange={() => onToggleActive(variant)}
            aria-label={variant.isActive ? 'Desactivar variante' : 'Activar variante'}
          />
          <span className="text-xs text-muted-foreground">
            {variant.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-pointer"
            disabled={isFirst}
            onClick={() => onMoveUp(variant)}
            title="Mover arriba"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-pointer"
            disabled={isLast}
            onClick={() => onMoveDown(variant)}
            title="Mover abajo"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

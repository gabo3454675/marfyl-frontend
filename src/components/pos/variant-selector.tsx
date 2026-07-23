'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';
import type { ProductVariant } from '@/lib/api/product-variants';

export interface VariantSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  variants: ProductVariant[];
  loading?: boolean;
  onSelect: (variant: ProductVariant) => void;
}

/**
 * Formats a unit quantity into a compact label.
 * e.g. 1 → '', 12 → 'x12', 36 → 'x36'
 */
function formatUnitQuantity(qty: number): string | null {
  if (qty <= 1) return null;
  return `x${qty}`;
}

export function VariantSelector({
  open,
  onOpenChange,
  productName,
  variants,
  loading = false,
  onSelect,
}: VariantSelectorProps) {
  const handleSelect = (variant: ProductVariant) => {
    onSelect(variant);
    onOpenChange(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 rounded-2xl p-0 sm:max-w-md sm:rounded-2xl">
        <DialogHeader className="border-b border-border/60 px-5 pb-3 pt-5">
          <DialogTitle className="flex items-center gap-2 text-base leading-snug">
            <Package className="h-5 w-5 shrink-0 text-primary" />
            <span className="line-clamp-1">{productName}</span>
          </DialogTitle>
          <DialogDescription className="mt-1 text-left text-sm">
            Selecciona una presentación
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(50dvh,400px)] overflow-y-auto overscroll-y-contain px-4 py-3">
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex h-16 animate-pulse items-center gap-3 rounded-xl bg-muted/50 px-4"
                >
                  <div className="h-5 w-24 rounded-md bg-muted-foreground/10" />
                  <div className="ml-auto h-5 w-20 rounded-md bg-muted-foreground/10" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {variants.map((variant, idx) => {
                const unitLabel = formatUnitQuantity(variant.unitQuantity);
                return (
                  <button
                    key={variant.id}
                    type="button"
                    className={cn(
                      'group relative flex w-full items-center gap-3 rounded-xl border border-border/60',
                      'bg-card px-4 py-3.5 text-left shadow-sm',
                      'transition-all duration-150 ease-out',
                      'hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-md',
                      'active:scale-[0.98] active:bg-primary/[0.08]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
                      'touch-manipulation',
                    )}
                    style={{
                      animation: `variantFadeIn 250ms ease-out both`,
                      animationDelay: `${idx * 40}ms`,
                    }}
                    onClick={() => handleSelect(variant)}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground/90">
                          {variant.name}
                        </span>
                        {unitLabel && (
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase leading-none text-primary">
                            {unitLabel}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground/70">
                        {variant.stockBehavior === 'NO_DEDUCT' ? 'No descuenta inventario' : 'Descuenta inventario'}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-base font-bold tabular-nums text-primary">
                        {formatPrice(variant.salePrice)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'absolute inset-0 rounded-xl ring-1 ring-inset',
                        'ring-transparent group-hover:ring-primary/10 group-focus-visible:ring-primary/30',
                        'transition-all duration-150 ease-out pointer-events-none',
                      )}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 px-5 py-4">
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-12 w-full touch-manipulation text-sm font-semibold rounded-xl"
            >
              Cancelar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

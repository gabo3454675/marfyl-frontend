'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminCard } from '@/components/admin/admin-card';
import { variantService } from '@/lib/api/variants';
import { getApiErrorMessage } from '@/lib/api/get-error-message';
import type { ProductVariant, CreateVariantPayload } from '@/types/product-variant';
import { VariantListItem } from './VariantListItem';
import { VariantForm } from './VariantForm';

interface VariantManagerProps {
  productId: number;
  /** Callback cuando la variante default cambia y se necesita sincronizar salePrice */
  onDefaultChanged?: (variant: ProductVariant) => void;
}

export function VariantManager({ productId, onDefaultChanged }: VariantManagerProps) {
  const queryClient = useQueryClient();
  const queryKey = ['products', productId, 'variants'];

  // ── Queries ──────────────────────────────────────────────
  const {
    data: variants = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ProductVariant[], Error>({
    queryKey,
    queryFn: () => variantService.getAll(productId),
    staleTime: 15_000,
  });

  // ── Dialog state ─────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // ── Mutations ────────────────────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateVariantPayload) =>
      variantService.create(productId, payload),
    onSuccess: (created) => {
      toast.success(`Variante "${created.name}" creada`);
      if (created.isDefault && onDefaultChanged) {
        onDefaultChanged(created);
      }
      invalidate();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Error al crear la variante'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof variantService.update>[1]) =>
      variantService.update(productId, payload),
    onSuccess: (updated) => {
      toast.success(`Variante "${updated.name}" actualizada`);
      if (updated.isDefault && onDefaultChanged) {
        onDefaultChanged(updated);
      }
      invalidate();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Error al actualizar la variante'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (variantId: number) => variantService.remove(productId, variantId),
    onSuccess: () => {
      toast.success('Variante eliminada');
      setDeleteConfirmId(null);
      invalidate();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Error al eliminar la variante'));
    },
  });

  // ── Handlers ─────────────────────────────────────────────

  const handleOpenCreate = useCallback(() => {
    setEditingVariant(null);
    setFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    async (payload: CreateVariantPayload) => {
      if (editingVariant) {
        await updateMutation.mutateAsync({ id: editingVariant.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    },
    [editingVariant, createMutation, updateMutation]
  );

  const handleDelete = useCallback(
    (variant: ProductVariant) => {
      setDeleteConfirmId(variant.id);
    },
    []
  );

  const confirmDelete = useCallback(() => {
    if (deleteConfirmId != null) {
      deleteMutation.mutate(deleteConfirmId);
    }
  }, [deleteConfirmId, deleteMutation]);

  const cancelDelete = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  const handleSetDefault = useCallback(
    (variant: ProductVariant) => {
      // Unset all others, set this one
      const updates = variants.map((v) => ({
        id: v.id,
        isDefault: v.id === variant.id,
      }));
      // Optimistic approach: update sequentially
      const run = async () => {
        try {
          // First unset current default if exists
          const currentDefault = variants.find((v) => v.isDefault);
          if (currentDefault && currentDefault.id !== variant.id) {
            await variantService.update(productId, {
              id: currentDefault.id,
              isDefault: false,
            });
          }
          // Then set new default
          const updated = await variantService.update(productId, {
            id: variant.id,
            isDefault: true,
            salePrice: variant.salePrice,
          });
          toast.success(`"${variant.name}" ahora es la variante default`);
          // Sync salePrice to product
          if (onDefaultChanged) {
            onDefaultChanged(updated);
          }
          invalidate();
        } catch (err) {
          toast.error(getApiErrorMessage(err, 'Error al cambiar variante default'));
        }
      };
      run();
    },
    [variants, productId, onDefaultChanged, invalidate]
  );

  const handleToggleActive = useCallback(
    (variant: ProductVariant) => {
      updateMutation.mutate({
        id: variant.id,
        isActive: !variant.isActive,
      });
    },
    [updateMutation]
  );

  const handleMoveUp = useCallback(
    (variant: ProductVariant) => {
      const sorted = [...variants].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = sorted.findIndex((v) => v.id === variant.id);
      if (idx <= 0) return;
      // Swap sortOrder
      const above = sorted[idx - 1];
      const reordered = [
        { id: variant.id, sortOrder: above.sortOrder },
        { id: above.id, sortOrder: variant.sortOrder },
      ];
      variantService
        .reorder(productId, reordered)
        .then(() => {
          invalidate();
        })
        .catch((err) => {
          toast.error(getApiErrorMessage(err, 'Error al reordenar'));
        });
    },
    [variants, productId, invalidate]
  );

  const handleMoveDown = useCallback(
    (variant: ProductVariant) => {
      const sorted = [...variants].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = sorted.findIndex((v) => v.id === variant.id);
      if (idx < 0 || idx >= sorted.length - 1) return;
      const below = sorted[idx + 1];
      const reordered = [
        { id: variant.id, sortOrder: below.sortOrder },
        { id: below.id, sortOrder: variant.sortOrder },
      ];
      variantService
        .reorder(productId, reordered)
        .then(() => {
          invalidate();
        })
        .catch((err) => {
          toast.error(getApiErrorMessage(err, 'Error al reordenar'));
        });
    },
    [variants, productId, invalidate]
  );

  const nextSortOrder = variants.length > 0
    ? Math.max(...variants.map((v) => v.sortOrder)) + 1
    : 0;

  // ── Render ───────────────────────────────────────────────
  return (
    <>
      <AdminCard
        title="Variantes"
        description="Distintas presentaciones de este producto (talla, empaque, etc.)"
        headerActions={
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="cursor-pointer shrink-0"
          >
            <Plus className="mr-1 h-4 w-4" />
            Agregar
          </Button>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Cargando variantes...
            </span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {getApiErrorMessage(error, 'Error al cargar las variantes')}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : variants.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <p className="text-sm text-muted-foreground">
              No hay variantes registradas
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCreate}
              className="cursor-pointer"
            >
              <Plus className="mr-1 h-4 w-4" />
              Agregar primera variante
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {[...variants]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((variant, idx) => (
                <VariantListItem
                  key={variant.id}
                  variant={variant}
                  isFirst={idx === 0}
                  isLast={idx === variants.length - 1}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                  onToggleActive={handleToggleActive}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              ))}
          </div>
        )}
      </AdminCard>

      {/* Dialog de crear/editar */}
      <VariantForm
        open={formOpen}
        onOpenChange={setFormOpen}
        variant={editingVariant}
        nextSortOrder={nextSortOrder}
        onSubmit={handleFormSubmit}
      />

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteConfirmId != null} onOpenChange={(open) => { if (!open) cancelDelete(); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>¿Eliminar variante?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La variante se eliminará
              permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

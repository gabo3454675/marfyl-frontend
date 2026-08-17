'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layers, Loader2, Plus, Sparkles, UtensilsCrossed } from 'lucide-react';
import { AdminCard } from '@/components/admin/admin-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BundleRecipeEditor,
  parseRecipeFromUnknown,
  type RecipeLine,
} from '@/components/bundle-recipe-editor';
import { productService, type BomComboView, type ComboWorkspaceItem } from '@/lib/api/products';
import { getApiErrorMessage } from '@/lib/api/get-error-message';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

type Kind = 'combo' | 'service';

export function CombosServiciosPanel() {
  const queryClient = useQueryClient();
  const { canManageProducts } = usePermission();
  const { formatForDisplay } = useDisplayCurrency();

  const { data: workspace, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['products', 'combo-workspace'],
    queryFn: () => productService.getComboWorkspace(),
    staleTime: 30_000,
  });

  const { data: bom } = useQuery({
    queryKey: ['products', 'bom'],
    queryFn: () => productService.getBom(),
    staleTime: 15_000,
  });

  const bomById = useMemo(() => {
    const map = new Map<number, BomComboView>();
    for (const row of bom?.combos ?? []) map.set(row.id, row);
    return map;
  }, [bom]);

  const combos = workspace?.combos ?? [];
  const services = workspace?.services ?? [];
  const recipeCatalog = workspace?.recipeCatalog ?? [];

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>('combo');
  const [editing, setEditing] = useState<ComboWorkspaceItem | null>(null);
  const [name, setName] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [lines, setLines] = useState<RecipeLine[]>([]);
  const [saving, setSaving] = useState(false);

  const nameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of combos) map.set(p.id, p.name);
    for (const p of services) map.set(p.id, p.name);
    for (const p of recipeCatalog) map.set(p.id, p.name);
    return map;
  }, [combos, services, recipeCatalog]);

  const openCreate = (nextKind: Kind) => {
    setKind(nextKind);
    setEditing(null);
    setName('');
    setSalePrice('');
    setLines([]);
    setOpen(true);
  };

  const openEdit = (product: ComboWorkspaceItem) => {
    const nextKind: Kind = product.isBundle ? 'combo' : 'service';
    setKind(nextKind);
    setEditing(product);
    setName(product.name);
    setSalePrice(String(product.salePrice ?? ''));
    setLines(parseRecipeFromUnknown(product.bundleComponents));
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim() || !salePrice) {
      toast.error('Pon un nombre y un precio.');
      return;
    }
    if (kind === 'combo' && lines.length === 0) {
      toast.error('El combo necesita al menos un producto (por ejemplo las botellas del tobo).');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        salePrice: parseFloat(salePrice),
        isBundle: kind === 'combo',
        isService: kind === 'service',
        bundleComponents: kind === 'combo' ? lines : lines.length > 0 ? lines : null,
      };
      if (editing) {
        await productService.update(editing.id, payload);
        toast.success(kind === 'combo' ? 'Combo actualizado' : 'Servicio actualizado');
      } else {
        await productService.create(payload);
        toast.success(kind === 'combo' ? 'Combo listo para vender en el POS' : 'Servicio listo para vender en el POS');
      }
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['products', 'bom'] });
      await queryClient.invalidateQueries({ queryKey: ['products', 'combo-workspace'] });
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || 'No se pudo guardar. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const recipeLabel = (product: ComboWorkspaceItem) => {
    const parsed = parseRecipeFromUnknown(product.bundleComponents);
    if (parsed.length === 0) {
      return product.isService ? 'Solo cobro, sin descontar inventario' : 'Sin productos';
    }
    return parsed
      .map((line) => `${line.quantity} × ${nameById.get(line.productId) ?? `#${line.productId}`}`)
      .join(' · ');
  };

  return (
    <div className="space-y-5">
      <AdminCard>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Aquí se arman las cosas que se venden juntas o que se cobran sin ser inventario.
          El <strong>combo</strong> (tobo, paquete) descuenta varios productos a la vez según su receta (BOM).
          El <strong>servicio</strong> (descorche, cubierto) solo cobra, y puede usar insumos si quieres.
        </p>
        {bom && bom.blockedBy.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/8 px-3.5 py-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Estos productos bloquean combos
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {bom.blockedBy.slice(0, 8).map((row) => (
                <li key={row.productId}>
                  <span className="font-medium text-foreground">{row.name}</span>
                  {' · '}
                  {row.availableStock} en stock · frena {row.comboNames.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}
        {canManageProducts && (
          <div className="mt-4 flex flex-col min-[420px]:flex-row gap-2">
            <Button type="button" className="cursor-pointer" onClick={() => openCreate('combo')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo combo / tobo
            </Button>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={() => openCreate('service')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo servicio
            </Button>
          </div>
        )}
      </AdminCard>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <AdminCard title="Error">
          <p className="text-sm text-destructive">
            {getApiErrorMessage(
              error,
              'No se pudieron cargar combos y servicios. Revisa la API e inténtalo de nuevo.',
            )}
          </p>
          <Button type="button" variant="secondary" className="mt-3" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </AdminCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <KindList
            title="Combos y tobos"
            icon={<Layers className="h-4 w-4 text-amber-500" />}
            empty="Todavía no hay combos. Crea uno con las botellas que lleva el tobo o el paquete."
            items={combos}
            formatPrice={formatForDisplay}
            recipeLabel={recipeLabel}
            canEdit={canManageProducts}
            onEdit={openEdit}
            bomById={bomById}
          />
          <KindList
            title="Servicios"
            icon={<UtensilsCrossed className="h-4 w-4 text-sky-500" />}
            empty="Todavía no hay servicios. El descorche o el cubierto se cobran aquí y salen en el POS."
            items={services}
            formatPrice={formatForDisplay}
            recipeLabel={recipeLabel}
            canEdit={canManageProducts}
            onEdit={openEdit}
          />
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? kind === 'combo'
                  ? 'Editar combo'
                  : 'Editar servicio'
                : kind === 'combo'
                  ? 'Nuevo combo / tobo'
                  : 'Nuevo servicio'}
            </DialogTitle>
            <DialogDescription>
              {kind === 'combo'
                ? 'Ponle un nombre claro (ej. Tobo Polar 12), el precio de venta y qué productos descuenta.'
                : 'Ponle un nombre (ej. Descorche) y el precio. Los insumos son opcionales.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="combo-name">Nombre</Label>
              <Input
                id="combo-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={kind === 'combo' ? 'Tobo Polar 12' : 'Descorche'}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="combo-price">Precio de venta (USD)</Label>
              <Input
                id="combo-price"
                type="number"
                min="0"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <BundleRecipeEditor
              value={lines}
              onChange={setLines}
              catalog={recipeCatalog}
              excludeProductId={editing?.id}
              variant={kind === 'combo' ? 'combo' : 'service'}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {editing ? 'Guardar' : 'Crear y usar en POS'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KindList({
  title,
  icon,
  empty,
  items,
  formatPrice,
  recipeLabel,
  canEdit,
  onEdit,
  bomById,
}: {
  title: string;
  icon: ReactNode;
  empty: string;
  items: ComboWorkspaceItem[];
  formatPrice: (n: number) => string;
  recipeLabel: (p: ComboWorkspaceItem) => string;
  canEdit: boolean;
  onEdit: (p: ComboWorkspaceItem) => void;
  bomById?: Map<number, BomComboView>;
}) {
  return (
    <AdminCard
      title={
        <span className="inline-flex items-center gap-2">
          {icon}
          {title}
        </span>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground leading-relaxed py-4">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const bomRow = bomById?.get(item.id);
            return (
            <li
              key={item.id}
              className="rounded-xl border border-border/60 bg-background/60 p-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {recipeLabel(item)}
                  </p>
                  {bomRow && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant={bomRow.buildable > 0 ? 'secondary' : 'destructive'}
                        className="font-normal tabular-nums"
                      >
                        {bomRow.recipeOk
                          ? `Puedes armar ${bomRow.buildable}`
                          : 'Receta incompleta'}
                      </Badge>
                      {bomRow.bottleneck && bomRow.buildable === 0 && bomRow.recipeOk && (
                        <span className="text-xs text-muted-foreground">
                          Falta {bomRow.bottleneck.name} ({bomRow.bottleneck.availableStock} disp.)
                        </span>
                      )}
                      {bomRow.bottleneck && bomRow.buildable > 0 && bomRow.buildable < 8 && (
                        <span className="text-xs text-muted-foreground">
                          Limita {bomRow.bottleneck.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums">{formatPrice(Number(item.salePrice))}</p>
                  <Badge variant="secondary" className="mt-1 font-normal">
                    {item.isBundle ? 'Combo' : 'Servicio'}
                  </Badge>
                </div>
              </div>
              {canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 cursor-pointer"
                  onClick={() => onEdit(item)}
                >
                  Editar
                </Button>
              )}
            </li>
            );
          })}
        </ul>
      )}
    </AdminCard>
  );
}

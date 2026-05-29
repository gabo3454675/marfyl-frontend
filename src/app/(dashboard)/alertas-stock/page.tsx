'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Loader2, Package, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import Link from 'next/link';
import { EmptyStatePanel } from '@/components/help/empty-state-panel';
import { ContentFaqSheet } from '@/components/help/content-faq-sheet';
import { EMPTY_STATES } from '@/lib/content/marketing-copy';
import { INVENTORY_FAQ } from '@/lib/content/faq-content';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';

interface AlertaProducto {
  id: number;
  name: string;
  sku: string | null;
  stock: number;
  minStock: number;
  salePrice: number;
}

export default function AlertasStockPage() {
  const { formatForDisplay } = useDisplayCurrency();
  const [items, setItems] = useState<AlertaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlertas = useCallback(async () => {
    setError(null);
    try {
      const res = await apiClient.get<AlertaProducto[]>('/products/alertas-stock');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('No se pudo cargar la lista de alertas.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);

  return (
    <AdminPageShell
      eyebrow="Inventario"
      title="Alertas de inventario"
      subtitle="Productos con stock por debajo del mínimo. Las notificaciones se envían al registrar autoconsumos o ajustes que dejen el stock bajo el mínimo."
      loading={loading}
      actions={
        <>
          <ContentFaqSheet
            title="Alertas de inventario"
            description="Cómo se generan y qué hacer cuando un producto aparece en la lista."
            items={INVENTORY_FAQ}
            triggerLabel="Ayuda"
          />
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => {
              setLoading(true);
              fetchAlertas();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </>
      }
    >
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <AdminCard
        title={
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos bajo stock mínimo
          </span>
        }
        description={
          items.length === 0
            ? 'No hay productos por debajo del mínimo configurado.'
            : `${items.length} producto(s) requieren atención.`
        }
      >
        {items.length === 0 ? (
          <EmptyStatePanel
            title={EMPTY_STATES.stockAlerts.title}
            description={EMPTY_STATES.stockAlerts.description}
            tips={[...EMPTY_STATES.stockAlerts.tips]}
            primaryCta={EMPTY_STATES.stockAlerts.primaryCta}
            secondaryCta={EMPTY_STATES.stockAlerts.secondaryCta}
          />
        ) : (
          <AdminTableWrap>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Precio venta</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span className="font-medium">{p.name}</span>
                      {p.sku && (
                        <span className="ml-2 text-muted-foreground text-xs">SKU: {p.sku}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-amber-600 dark:text-amber-400">
                      {p.stock}
                    </TableCell>
                    <TableCell className="text-right">{p.minStock}</TableCell>
                    <TableCell className="text-right">{formatForDisplay(p.salePrice)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild className="cursor-pointer">
                        <Link href={`/products?editar=${p.id}`}>Editar</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminTableWrap>
        )}
      </AdminCard>
    </AdminPageShell>
  );
}

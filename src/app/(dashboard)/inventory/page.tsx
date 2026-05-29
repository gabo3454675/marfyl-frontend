'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';

export default function InventoryPage() {
  return (
    <AdminPageShell
      eyebrow="Inventario"
      title="Inventario"
      subtitle="Gestiona productos, existencias y movimientos desde un solo lugar."
      actions={
        <Button className="w-full sm:w-auto shrink-0 cursor-pointer" asChild>
          <a href="/products">
            <Plus className="mr-2 h-4 w-4" />
            Ir a productos
          </a>
        </Button>
      }
    >
      <AdminCard
        title="Productos"
        description="El catálogo completo vive en la sección Productos. Usa movimientos para ajustes y autoconsumo."
      >
        <p className="text-sm text-muted-foreground">
          No hay productos en esta vista legacy. Abre{' '}
          <a href="/products" className="text-primary font-medium hover:underline cursor-pointer">
            Productos
          </a>{' '}
          o{' '}
          <a href="/inventory/movements" className="text-primary font-medium hover:underline cursor-pointer">
            Movimientos
          </a>
          .
        </p>
      </AdminCard>
    </AdminPageShell>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Trash2, Users, AlertTriangle, Package, CreditCard } from 'lucide-react';
import apiClient, { invoiceService } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { HelpCenterCard } from '@/components/help/help-center-card';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';

export default function SettingsPage() {
  const router = useRouter();
  const { user, getOrganizations } = useAuthStore();
  const [clearing, setClearing] = useState(false);
  const [clearingInventory, setClearingInventory] = useState(false);
  const [inventoryTenantId, setInventoryTenantId] = useState<string>('');
  const isSuperAdmin = !!user?.isSuperAdmin;
  const organizations = getOrganizations();

  const handleClearTestData = async () => {
    if (
      !confirm(
        '¿Borrar todo el historial de ventas y facturación de esta organización? Esta acción no se puede deshacer y es solo para entornos de desarrollo.'
      )
    ) {
      return;
    }
    setClearing(true);
    try {
      const res = await invoiceService.clearTestData();
      alert(res.deleted != null ? `${res.message} (${res.deleted} facturas)` : res.message);
    } catch (error: any) {
      alert(error.response?.data?.message ?? 'Error al borrar el historial');
    } finally {
      setClearing(false);
    }
  };

  const handleClearInventory = async () => {
    const tenantId = inventoryTenantId ? parseInt(inventoryTenantId, 10) : 0;
    if (!tenantId) {
      alert('Selecciona una organización.');
      return;
    }
    const org = organizations.find((o) => o.id === tenantId);
    if (
      !confirm(
        `¿Eliminar TODOS los productos y movimientos de inventario de "${org?.name ?? tenantId}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    setClearingInventory(true);
    try {
      const res = await apiClient.delete<{ deletedMovements: number; deletedProducts: number }>('/inventory/clear', {
        data: { tenantId },
      });
      alert(
        `Inventario limpiado: ${res.data.deletedProducts} productos y ${res.data.deletedMovements} movimientos eliminados.`
      );
      setInventoryTenantId('');
    } catch (error: any) {
      alert(error.response?.data?.message ?? 'Error al limpiar el inventario.');
    } finally {
      setClearingInventory(false);
    }
  };

  return (
    <AdminPageShell
      maxWidth="narrow"
      eyebrow="Administración"
      title="Configuración"
      subtitle="Ajustes de la organización, equipo y herramientas de administración."
    >
      <HelpCenterCard />

      <AdminCard
        title={
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Modalidades de pago (POS)
          </span>
        }
        description={
          <>
            En el punto de venta puede cobrar en efectivo (USD o Bs), Pago Móvil, Zelle, tarjeta o crédito de
            cliente. Las etiquetas mostradas al cajero están en{' '}
            <span className="font-mono text-xs">POS → Modalidades de pago</span>. Crédito: límite por defecto al
            activar cuenta <span className="font-mono">50 USD</span> y plazo{' '}
            <span className="font-mono">8 días</span> (ajustables en Cuentas por Cobrar).
          </>
        }
      />

      <AdminCard
        title={
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Equipo
          </span>
        }
        description="Gestiona miembros, roles e invitaciones de tu organización"
      >
        <Button variant="outline" onClick={() => router.push('/settings/team')} className="cursor-pointer">
          Ir a Equipo
        </Button>
      </AdminCard>

      {isSuperAdmin && (
        <>
          <AdminCard
            className="border-red-500/40 dark:border-red-600/40"
            title={
              <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Package className="h-5 w-5" />
                Limpiar inventario (Super Admin)
              </span>
            }
            description={
              <span className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                Elimina todos los productos y movimientos de inventario de la organización elegida. Solo Super Admin.
                Si hay productos en facturas, la operación fallará hasta que se corrijan.
              </span>
            }
          >
            <div className="space-y-3">
              <Select value={inventoryTenantId} onValueChange={setInventoryTenantId}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Seleccionar organización" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={String(org.id)}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                onClick={handleClearInventory}
                disabled={clearingInventory || !inventoryTenantId}
                className="cursor-pointer"
              >
                {clearingInventory ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Limpiando...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpiar inventario de esta organización
                  </>
                )}
              </Button>
            </div>
          </AdminCard>

          <AdminCard
            className="border-amber-500/50 dark:border-amber-600/50"
            title={
              <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Trash2 className="h-5 w-5" />
                Limpieza de desarrollo
              </span>
            }
            description={
              <span className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                Solo Super Admin. Borra todo el historial de ventas y facturación de la organización actual para dejar el
                sistema en cero durante el desarrollo. No restaura stock de productos.
              </span>
            }
          >
            <Button variant="destructive" onClick={handleClearTestData} disabled={clearing} className="cursor-pointer">
              {clearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Borrando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Borrar historial de ventas/facturación
                </>
              )}
            </Button>
          </AdminCard>
        </>
      )}
    </AdminPageShell>
  );
}

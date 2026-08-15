'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, CreditCard, ScrollText, Cable } from 'lucide-react';
import { HelpCenterCard } from '@/components/help/help-center-card';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';
import { usePermission } from '@/hooks/usePermission';
import { useAuthStore } from '@/store/useAuthStore';
import { isHybridEnabledForOrganization } from '@/lib/hybrid/feature';

export default function SettingsPage() {
  const router = useRouter();
  const { isSuperAdmin } = usePermission();
  const currentOrg = useAuthStore((s) => {
    void s.selectedOrganizationId;
    return s.getCurrentOrganization();
  });
  const showHybrid =
    isSuperAdmin && isHybridEnabledForOrganization(currentOrg);

  return (
    <AdminPageShell
      maxWidth="narrow"
      eyebrow="Administración"
      title="Configuración"
      subtitle="Ajustes de la organización, equipo y herramientas de administración."
    >
      <HelpCenterCard />

      {isSuperAdmin && (
        <AdminCard
          title={
            <span className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Trazabilidad
            </span>
          }
          description="Bitácora de quién editó o anuló facturas, cambió precios, registró autoconsumo o tocó el equipo."
        >
          <Button
            variant="outline"
            onClick={() => router.push('/trazabilidad')}
            className="h-11 w-full cursor-pointer sm:w-auto"
          >
            Ver bitácora
          </Button>
        </AdminCard>
      )}

      {showHybrid && (
        <AdminCard
          title={
            <span className="flex items-center gap-2">
              <Cable className="h-5 w-5" />
              Hybrid POS
            </span>
          }
          description="Diagnóstico de conexión con la API Hybrid (configurado, latencia, health)."
        >
          <Button
            variant="outline"
            onClick={() => router.push('/hybrid/conexion')}
            className="h-11 w-full cursor-pointer sm:w-auto"
          >
            Ver conexión
          </Button>
        </AdminCard>
      )}

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
        <Button
          variant="outline"
          onClick={() => router.push('/settings/team')}
          className="h-11 w-full cursor-pointer sm:w-auto"
        >
          Ir a Equipo
        </Button>
      </AdminCard>
    </AdminPageShell>
  );
}

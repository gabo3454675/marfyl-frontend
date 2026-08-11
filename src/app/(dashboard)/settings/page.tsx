'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, CreditCard } from 'lucide-react';
import { HelpCenterCard } from '@/components/help/help-center-card';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';

export default function SettingsPage() {
  const router = useRouter();

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
    </AdminPageShell>
  );
}

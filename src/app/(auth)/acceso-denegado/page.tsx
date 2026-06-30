'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface DeniedInfo {
  route: string;
  permission: string;
  role: string;
}

export default function AccesoDenegadoPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const selectedOrganizationId = useAuthStore((state) => state.selectedOrganizationId);
  const selectedCompanyId = useAuthStore((state) => state.selectedCompanyId);
  const selectedId = selectedOrganizationId || selectedCompanyId;
  const currentOrg = user?.organizations?.find((o) => o.id === selectedId);
  const isPosOperator = currentOrg?.role === 'POS_OPERATOR';

  const [deniedInfo, setDeniedInfo] = useState<DeniedInfo>({
    route: '',
    permission: '',
    role: '',
  });

  useEffect(() => {
    const route = sessionStorage.getItem('denied-route') || '';
    const permission = sessionStorage.getItem('required-permission') || '';
    const role = sessionStorage.getItem('current-role') || '';

    setDeniedInfo({ route, permission, role });

    // Limpiar después de leer
    sessionStorage.removeItem('denied-route');
    sessionStorage.removeItem('required-permission');
    sessionStorage.removeItem('current-role');

    // POS_OPERATOR: redirigir directamente al POS si intentó acceder al dashboard
    if (role === 'POS_OPERATOR' && (route === '/' || route === '')) {
      router.replace('/pos');
    }
  }, [router]);

  // POS_OPERATOR en loop de dashboard: mostrar loading mientras redirige
  if (isPosOperator && (deniedInfo.route === '/' || deniedInfo.route === '')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Redirigiendo al POS...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground max-w-md">
          No tienes permisos para acceder a esta sección. Contacta al
          administrador si crees que esto es un error.
        </p>
      </div>

      {deniedInfo.route && (
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-left max-w-md w-full space-y-1">
          <p>
            <span className="font-medium text-foreground">Ruta:</span>{' '}
            {deniedInfo.route}
          </p>
          <p>
            <span className="font-medium text-foreground">Permiso requerido:</span>{' '}
            {deniedInfo.permission}
          </p>
          <p>
            <span className="font-medium text-foreground">Tu rol:</span>{' '}
            {deniedInfo.role}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
        <Button onClick={() => router.push(isPosOperator ? '/pos' : '/')}>
          {isPosOperator ? 'Ir al POS' : 'Ir al Dashboard'}
        </Button>
      </div>
    </div>
  );
}

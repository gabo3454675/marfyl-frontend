'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteAccess } from '@/hooks/useRouteAccess';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  pathname: string;
}

/**
 * Componente que protege rutas verificando permisos del usuario.
 * Si no tiene acceso, redirige a /acceso-denegado.
 *
 * @example
 * <RouteGuard pathname="/products">
 *   <ProductsPage />
 * </RouteGuard>
 */
export function RouteGuard({ children, pathname }: RouteGuardProps) {
  const { hasAccess, requiredPermission, currentRole } = useRouteAccess(pathname);
  const router = useRouter();

  useEffect(() => {
    if (!hasAccess) {
      // Guardar la ruta intentada para mostrar en la página de acceso denegado
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('denied-route', pathname);
        sessionStorage.setItem('required-permission', requiredPermission || '');
        sessionStorage.setItem('current-role', currentRole);
      }
      router.push('/acceso-denegado');
    }
  }, [hasAccess, pathname, requiredPermission, currentRole, router]);

  // Mientras se verifica, mostrar skeleton
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

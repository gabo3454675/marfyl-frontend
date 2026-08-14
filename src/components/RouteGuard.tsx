'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteAccess } from '@/hooks/useRouteAccess';
import { getFeatureForPath, isProductFeatureEnabled } from '@/lib/features';
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
  const feature = getFeatureForPath(pathname);
  const featureOn = !feature || isProductFeatureEnabled(feature);
  const allowed = hasAccess && featureOn;

  useEffect(() => {
    if (!featureOn) {
      router.replace('/');
      return;
    }
    if (!hasAccess) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('denied-route', pathname);
        sessionStorage.setItem('required-permission', requiredPermission || '');
        sessionStorage.setItem('current-role', currentRole);
      }
      router.push('/acceso-denegado');
    }
  }, [hasAccess, featureOn, pathname, requiredPermission, currentRole, router]);

  if (!allowed) {
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

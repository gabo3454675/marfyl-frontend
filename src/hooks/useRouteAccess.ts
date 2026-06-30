import { useMemo } from 'react';
import { usePermission } from './usePermission';
import { getRequiredPermission, ROUTE_PERMISSIONS } from '@/config/route-permissions';
import type { PermissionKey } from '@/config/permissions';

export interface RouteAccessResult {
  /** true si el usuario tiene acceso a la ruta */
  hasAccess: boolean;
  /** Permiso requerido para la ruta, o null si no requiere permiso */
  requiredPermission: PermissionKey | null;
  /** Rol normalizado del usuario actual */
  currentRole: string;
}

/**
 * Hook para verificar acceso a rutas basado en permisos.
 *
 * @example
 * const { hasAccess, requiredPermission } = useRouteAccess('/products');
 * if (!hasAccess) return <AccessDenied />;
 */
export function useRouteAccess(pathname: string): RouteAccessResult {
  const permissions = usePermission();

  const result = useMemo(() => {
    const requiredPermission = getRequiredPermission(pathname);

    // Si no hay permiso requerido, es accesible
    if (!requiredPermission) {
      return {
        hasAccess: true,
        requiredPermission: null,
        currentRole: permissions.role,
      };
    }

    // Verificar si el usuario tiene el permiso
    const hasAccess = permissions[requiredPermission] === true;

    return {
      hasAccess,
      requiredPermission,
      currentRole: permissions.role,
    };
  }, [pathname, permissions]);

  return result;
}

/**
 * Hook que retorna todas las rutas del mapa que el usuario actual puede acceder.
 */
export function useAccessibleRoutes(): string[] {
  const permissions = usePermission();

  const accessibleRoutes = useMemo(() => {
    return Object.entries(ROUTE_PERMISSIONS)
      .filter(([_, permission]) => permissions[permission] === true)
      .map(([path]) => path);
  }, [permissions]);

  return accessibleRoutes;
}

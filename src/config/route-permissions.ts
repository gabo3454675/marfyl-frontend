import type { PermissionKey } from './permissions';

/**
 * Mapa de rutas → permisos requeridos.
 * Usado por useRouteAccess() y RouteGuard para proteger rutas.
 *
 * Si una ruta no está en este mapa, es accesible para todos los autenticados.
 */
export const ROUTE_PERMISSIONS: Record<string, PermissionKey> = {
  // Dashboard
  '/': 'canViewDashboard',

  // POS
  '/pos': 'canAccessPOS',

  // Inventario
  '/products': 'canManageProducts',
  '/servicios-combos': 'canManageProducts',
  '/inventory/movements': 'canManageInventory',
  '/autoconsumo': 'canManageInventory',
  '/alertas-stock': 'canManageInventory',

  // Clientes y Ventas
  '/customers': 'canManageCustomers',
  '/invoices': 'canManageInvoices',
  '/history': 'canManageInvoices',
  '/cierre-caja': 'canManageCierreCaja',
  '/credits': 'canViewCredits',

  // Gastos
  '/expenses': 'canManageExpenses',
  '/suppliers': 'canManageExpenses',
  '/accounts-payable': 'canManageExpenses',
  '/tasas': 'canManageExpenses',

  // Configuración
  '/settings': 'canManageSettings',
  '/settings/team': 'canManageTeam',
  '/nomina': 'canManageTeam',

  // Fiscal
  '/fiscal': 'canManageFiscal',
  '/fiscal/perfil': 'canManageFiscal',
  '/fiscal/libro-ventas': 'canManageFiscal',
  '/fiscal/libro-compras': 'canManageFiscal',
  '/fiscal/retenciones': 'canManageFiscal',
  '/fiscal/calendario': 'canManageFiscal',
  '/fiscal/predeclaracion': 'canManageFiscal',
  '/assistant': 'canManageFiscal',
};

/**
 * Obtiene el permiso requerido para una ruta.
 * Si la ruta no está en el mapa, retorna null (accesible para todos).
 *
 * Estrategia de resolución:
 * 1. Coincidencia exacta (e.g. '/products')
 * 2. Coincidencia por prefijo → busca el padre más cercano (e.g. '/products/abc' → '/products')
 */
export function getRequiredPermission(pathname: string): PermissionKey | null {
  // Buscar coincidencia exacta primero
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname];
  }

  // Buscar coincidencia por prefijo (para sub-rutas)
  const segments = pathname.split('/');
  while (segments.length > 1) {
    segments.pop();
    const parentPath = segments.join('/') || '/';
    if (ROUTE_PERMISSIONS[parentPath]) {
      return ROUTE_PERMISSIONS[parentPath];
    }
  }

  return null;
}

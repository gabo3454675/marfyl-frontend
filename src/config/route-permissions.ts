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
  '/panel-general': 'canViewDashboard',

  // POS
  '/pos': 'canAccessPOS',

  // Servicio en piso (estaciones)
  '/comanda': 'canTakeFloorOrder',
  '/comanda/cocina': 'canViewKitchenQueue',
  '/comanda/historial': 'canViewFloorHistory',

  // Inventario
  '/products': 'canManageProducts',
  '/servicios-combos': 'canManageProducts',
  '/inventory/movements': 'canManageInventory',
  '/inventory/invoice-upload': 'canManageInventory',
  '/inventory/purchases-import': 'canManageInventory',
  '/autoconsumo': 'canManageInventory',
  '/alertas-stock': 'canManageInventory',
  '/sales/import': 'canManageInventory',
  '/importar': 'canManageInventory',

  // Clientes y Ventas
  '/customers': 'canManageCustomers',
  '/invoices': 'canManageInvoices',
  '/history': 'canManageInvoices',
  '/licores': 'canManageInvoices',
  '/cierre-caja': 'canManageCierreCaja',
  '/caja-oficina': 'canManageCierreCaja',
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

  // Hybrid (solo org Monddy; el gate de org vive en useHybridPageGate)
  '/hybrid/ventas': 'canManageInvoices',

  // Fiscal
  '/fiscal': 'canManageFiscal',
  '/fiscal/perfil': 'canManageFiscal',
  '/fiscal/libro-ventas': 'canManageFiscal',
  '/fiscal/libro-compras': 'canManageFiscal',
  '/fiscal/retenciones': 'canManageFiscal',
  '/fiscal/calendario': 'canManageFiscal',
  '/fiscal/predeclaracion': 'canManageFiscal',
  '/assistant': 'canManageFiscal',

  // Concierto
  '/concierto': 'canManageCustomers',
  '/concierto/mapa': 'canManageCustomers',
  '/concierto/ordenes': 'canManageCustomers',
  '/concierto/escaner': 'canManageCustomers',
};

/** Rutas que admiten cualquiera de varios permisos (OR). */
export const ROUTE_ANY_PERMISSIONS: Record<string, PermissionKey[]> = {
  '/comanda': ['canTakeFloorOrder', 'canViewFloorHistory'],
};

/** Solo Super Admin (plataforma o rol SUPER_ADMIN del local). */
export const SUPER_ADMIN_ONLY_ROUTES = ['/trazabilidad', '/hybrid/conexion'] as const;

export function isSuperAdminOnlyRoute(pathname: string): boolean {
  return SUPER_ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

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

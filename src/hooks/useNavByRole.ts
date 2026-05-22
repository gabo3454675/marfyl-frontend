import type { usePermission } from '@/hooks/usePermission';

export type PermissionKey = keyof ReturnType<typeof usePermission>;

export interface NavItem {
  id: string;
  label: string;
  href: string;
  permission?: PermissionKey;
  icon?: unknown;
}

/**
 * Determina si un ítem del menú debe mostrarse según permisos del rol.
 */
export function canShowNavItem(
  item: NavItem,
  permissions: ReturnType<typeof usePermission>,
): boolean {
  if (item.permission) {
    const value = permissions[item.permission];
    const hasPermission = value === true;
    const role = String(permissions.role || '').toUpperCase();
    if (item.id === 'settings') {
      return hasPermission || role === 'ADMIN' || role === 'SUPER_ADMIN';
    }
    return hasPermission;
  }
  return false;
}

import type { usePermission } from '@/hooks/usePermission';
import { isProductFeatureEnabled, type ProductFeature } from '@/lib/features';

export type PermissionKey = keyof ReturnType<typeof usePermission>;

export interface NavItem {
  id: string;
  label: string;
  href: string;
  permission?: PermissionKey;
  icon?: unknown;
  feature?: ProductFeature;
  /** Visible solo para Super Admin. */
  superAdminOnly?: boolean;
}

/**
 * Determina si un ítem del menú debe mostrarse según permisos del rol y flags.
 */
export function canShowNavItem(
  item: NavItem,
  permissions: ReturnType<typeof usePermission>,
): boolean {
  if (item.feature && !isProductFeatureEnabled(item.feature)) {
    return false;
  }
  if (item.superAdminOnly) {
    return permissions.isSuperAdmin;
  }
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

'use client';

import { useMemo } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { GALLERY_MODULES, resolveModuleItems, type GalleryModuleConfig } from '@/config/modules';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Hook que retorna los módulos de la galería visibles para el usuario actual.
 * Filtra por permisos del rol, feature flags e ítems realmente visibles.
 */
export function useVisibleModules(): GalleryModuleConfig[] {
  const permissions = usePermission();
  const getCurrentOrganization = useAuthStore((s) => s.getCurrentOrganization);
  const selectedOrganizationId = useAuthStore((s) => s.selectedOrganizationId);
  const selectedCompanyId = useAuthStore((s) => s.selectedCompanyId);
  const superAdminOrganizations = useAuthStore((s) => s.superAdminOrganizations);
  const user = useAuthStore((s) => s.user);

  return useMemo(() => {
    const org = getCurrentOrganization();
    return GALLERY_MODULES
      .filter((mod) => {
        if (mod.featureFlag && !mod.featureFlag()) return false;
        if (!mod.requiredPermissions.some((perm) => permissions[perm] === true)) {
          return false;
        }
        return resolveModuleItems(mod, permissions, org).length > 0;
      })
      .sort((a, b) => a.order - b.order);
  }, [
    permissions,
    getCurrentOrganization,
    selectedOrganizationId,
    selectedCompanyId,
    superAdminOrganizations,
    user,
  ]);
}

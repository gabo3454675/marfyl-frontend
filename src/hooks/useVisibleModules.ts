'use client';

import { useMemo } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { useAuthStore } from '@/store/useAuthStore';
import { GALLERY_MODULES, type GalleryModuleConfig } from '@/config/modules';
import { isConcertFeatureEnabled } from '@/lib/concert/feature';

/**
 * Hook que retorna los módulos de la galería visibles para el usuario actual.
 * Filtra por permisos del rol y feature flags.
 */
export function useVisibleModules(): GalleryModuleConfig[] {
  const permissions = usePermission();
  const currentOrganization = useAuthStore((s) => s.getCurrentOrganization());

  return useMemo(() => {
    return GALLERY_MODULES
      .filter((mod) => {
        // Feature flag check — si el módulo tiene featureFlag, debe retornar true
        if (mod.featureFlag && !mod.featureFlag()) return false;

        // Permission check — OR logic: basta con tener AL MENOS UNO de los permisos requeridos
        return mod.requiredPermissions.some((perm) => permissions[perm] === true);
      })
      .sort((a, b) => a.order - b.order);
  }, [permissions, currentOrganization]);
}

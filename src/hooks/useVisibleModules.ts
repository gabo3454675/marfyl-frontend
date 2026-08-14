'use client';

import { useMemo } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { GALLERY_MODULES, resolveModuleItems, type GalleryModuleConfig } from '@/config/modules';

/**
 * Hook que retorna los módulos de la galería visibles para el usuario actual.
 * Filtra por permisos del rol, feature flags e ítems realmente visibles.
 */
export function useVisibleModules(): GalleryModuleConfig[] {
  const permissions = usePermission();

  return useMemo(() => {
    return GALLERY_MODULES
      .filter((mod) => {
        if (mod.featureFlag && !mod.featureFlag()) return false;
        if (!mod.requiredPermissions.some((perm) => permissions[perm] === true)) {
          return false;
        }
        return resolveModuleItems(mod, permissions).length > 0;
      })
      .sort((a, b) => a.order - b.order);
  }, [permissions]);
}

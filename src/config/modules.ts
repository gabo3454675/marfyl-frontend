import type { LucideIcon } from 'lucide-react';
import type { PermissionKey } from '@/config/permissions';
import type { AppNavItem } from '@/config/app-nav';
import { APP_NAV_ITEMS } from '@/config/app-nav';
import { FISCAL_NAV_ITEMS } from '@/config/fiscal-nav';
import { isProductFeatureEnabled } from '@/lib/features';
import { canShowNavItem, type NavItem } from '@/hooks/useNavByRole';
import type { UsePermissionReturn } from '@/hooks/usePermission';
import { MODULE_REGISTRY, deriveGalleryModules } from '@/config/module-registry';

/**
 * Referencia a un item de navegación existente.
 * navId debe coincidir con el id de APP_NAV_ITEMS o FISCAL_NAV_ITEMS.
 */
export type GalleryModuleItemRef = {
  navId: string;
  labelOverride?: string;
  hintOverride?: string;
  /** Tailwind gradient classes for the item icon (e.g. 'from-orange-400 to-orange-500'). Falls back to module accentGradient. */
  itemAccentGradient?: string;
};

/**
 * Configuración de un módulo de la galería.
 */
export type GalleryModuleConfig = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accentColor: string;       // tailwind text class
  accentGradient: string;    // tailwind gradient classes
  bgGradient: string;        // tailwind bg gradient
  itemRefs: GalleryModuleItemRef[];
  requiredPermissions: PermissionKey[];
  featureFlag?: () => boolean;
  directHref?: string;
  order: number;
};

/** Todos los items de navegación combinados (FiscalNavItems se extienden con permission por defecto). */
const ALL_NAV_ITEMS: AppNavItem[] = [
  ...APP_NAV_ITEMS,
  ...FISCAL_NAV_ITEMS.map((item) => ({ ...item, permission: 'canManageFiscal' as PermissionKey })),
];

/**
 * Resuelve un navId a su AppNavItem completo.
 */
export function getGalleryNavItem(navId: string): AppNavItem | undefined {
  return ALL_NAV_ITEMS.find((item) => item.id === navId);
}

/**
 * Resuelve los items de un módulo, aplicando overrides.
 */
export function resolveModuleItems(
  module: GalleryModuleConfig,
  permissions?: UsePermissionReturn,
  org?: { slug?: string | null; name?: string | null } | null,
): (AppNavItem & { hint?: string; itemAccentGradient?: string })[] {
  const items: (AppNavItem & { hint?: string; itemAccentGradient?: string })[] = [];
  for (const ref of module.itemRefs) {
    const base = getGalleryNavItem(ref.navId);
    if (!base) continue;
    if (base.feature && !isProductFeatureEnabled(base.feature)) continue;
    if (permissions && !canShowNavItem(base as NavItem, permissions, org)) continue;
    items.push({
      ...base,
      label: ref.labelOverride ?? base.label,
      hint: ref.hintOverride ?? base.hint,
      itemAccentGradient: ref.itemAccentGradient,
    });
  }
  return items;
}

/** Derivado del registry — módulos de la galería. */
export const GALLERY_MODULES: GalleryModuleConfig[] = deriveGalleryModules(MODULE_REGISTRY);

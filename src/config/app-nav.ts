import type { LucideIcon } from 'lucide-react';
import type { PermissionKey } from '@/config/permissions';
import type { ProductFeature } from '@/lib/features';
import { MODULE_REGISTRY, STANDALONE_NAV_ITEMS, deriveNavItems, deriveNavSections } from '@/config/module-registry';

/** @deprecated Use `PermissionKey` directly. Kept as alias for backward compatibility. */
export type NavPermission = PermissionKey;

export type AppNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission: PermissionKey;
  /** Texto corto para tooltips / menú móvil */
  hint?: string;
  /** Si está definido, el ítem solo se muestra con el flag encendido. */
  feature?: ProductFeature;
  /** Visible solo para Super Admin. */
  superAdminOnly?: boolean;
  /** Visible solo con orgs fundadoras Hybrid (legacy, ya no se usa en items). */
  hybridOrgOnly?: boolean;
};

export type AppNavSection = {
  id: string;
  label: string;
  itemIds: string[];
  /** Icono del hub (sidebar colapsado + tooltips) */
  icon: LucideIcon;
  /** Sección abierta por defecto si el usuario no tiene preferencia guardada */
  defaultOpen?: boolean;
};

/**
 * Accesos frecuentes — siempre visibles (si el rol tiene permiso).
 * Cada estación ve solo lo suyo: caja → POS; piso → en sección Servicio.
 */
export const APP_NAV_QUICK_ACCESS_IDS = ['dashboard', 'pos'] as const;

/** Derivado del registry — incluye items de módulos + standalone. */
export const APP_NAV_ITEMS: AppNavItem[] = deriveNavItems(MODULE_REGISTRY, STANDALONE_NAV_ITEMS);

/** Derivado del registry — secciones del sidebar. */
export const APP_NAV_SECTIONS: AppNavSection[] = deriveNavSections(MODULE_REGISTRY, STANDALONE_NAV_ITEMS);

export function resolveAppNavId(pathname: string): string {
  if (pathname === '/' || pathname === '/') return 'dashboard';
  if (pathname.startsWith('/pos')) return 'pos';
  if (pathname.startsWith('/comanda/historial')) return 'comanda';
  if (pathname.startsWith('/comanda/cocina')) return 'comanda-cocina';
  if (pathname.startsWith('/comanda')) return 'comanda';
  if (pathname.startsWith('/servicios-combos')) return 'licores';
  if (pathname.startsWith('/products')) return 'products';
  if (pathname.startsWith('/inventory/movements')) return 'movements';
  if (pathname.startsWith('/autoconsumo')) return 'movements';
  if (pathname.startsWith('/alertas-stock')) return 'products';
  if (pathname.startsWith('/inventory/invoice-upload')) return 'invoice-upload';
  if (pathname.startsWith('/inventory/purchases-import')) return 'invoice-upload';
  if (pathname.startsWith('/inventory')) return 'products';
  if (pathname.startsWith('/customers')) return 'customers';
  if (pathname.startsWith('/sales/import') || pathname.startsWith('/importar')) return 'invoices';
  if (pathname.startsWith('/invoices')) return 'invoices';
  if (pathname.startsWith('/history')) return 'invoices';
  if (pathname.startsWith('/licores')) return 'licores';
  if (pathname.startsWith('/cierre-caja')) return 'cierre-caja';
  if (pathname.startsWith('/caja-oficina')) return 'caja-oficina';
  if (pathname.startsWith('/credits')) return 'credits';
  if (pathname.startsWith('/expenses')) return 'expenses';
  if (pathname.startsWith('/suppliers')) return 'suppliers';
  if (pathname.startsWith('/accounts-payable')) return 'accounts-payable';
  if (pathname.startsWith('/tasas')) return 'tasas';
  if (pathname.startsWith('/trazabilidad')) return 'trazabilidad';
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname.startsWith('/nomina')) return 'nomina';
  if (pathname.startsWith('/concierto/escaner')) return 'concierto-escaner';
  if (pathname.startsWith('/concierto/mapa')) return 'concierto-mapa';
  if (pathname.startsWith('/concierto/ordenes')) return 'concierto-ordenes';
  if (pathname.startsWith('/concierto')) return 'concierto';
  return 'dashboard';
}

export function getNavItem(id: string) {
  return APP_NAV_ITEMS.find((i) => i.id === id);
}

export function getSectionIdForNavItem(navId: string): string | null {
  for (const section of APP_NAV_SECTIONS) {
    if (section.itemIds.includes(navId)) return section.id;
  }
  return null;
}

export function getQuickAccessItems(): AppNavItem[] {
  return APP_NAV_QUICK_ACCESS_IDS.map((id) => getNavItem(id)).filter(Boolean) as AppNavItem[];
}

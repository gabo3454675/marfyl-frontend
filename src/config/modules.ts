import type { LucideIcon } from 'lucide-react';
import type { PermissionKey } from '@/config/permissions';
import type { AppNavItem } from '@/config/app-nav';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Wallet,
  TrendingUp,
  Box,
  DollarSign,
  UsersRound,
  Settings,
  Scale,
  Ticket,
  Layers,
} from 'lucide-react';
import { APP_NAV_ITEMS } from '@/config/app-nav';
import { FISCAL_NAV_ITEMS } from '@/config/fiscal-nav';
import { CONCERT_NAV_ITEMS } from '@/config/concert-nav';
import { isConcertFeatureEnabled } from '@/lib/concert/feature';
import { isModuleGalleryEnabled } from '@/lib/gallery/feature';

/**
 * Referencia a un item de navegación existente.
 * navId debe coincidir con el id de APP_NAV_ITEMS, FISCAL_NAV_ITEMS o CONCERT_NAV_ITEMS.
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
  ...CONCERT_NAV_ITEMS,
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
export function resolveModuleItems(module: GalleryModuleConfig): (AppNavItem & { hint?: string; itemAccentGradient?: string })[] {
  return module.itemRefs
    .map((ref) => {
      const base = getGalleryNavItem(ref.navId);
      if (!base) return null;
      return {
        ...base,
        label: ref.labelOverride ?? base.label,
        hint: ref.hintOverride ?? base.hint,
        itemAccentGradient: ref.itemAccentGradient,
      };
    })
    .filter(Boolean) as (AppNavItem & { hint?: string; itemAccentGradient?: string })[];
}

/** 10 módulos de la galería — el orden determina la visualización. */
export const GALLERY_MODULES: GalleryModuleConfig[] = [
  {
    id: 'panel-general',
    label: 'Panel General',
    description: 'Resumen del día, KPIs y alertas',
    icon: LayoutDashboard,
    accentColor: 'text-blue-500',
    accentGradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-500/10 to-blue-600/5',
    itemRefs: [
      { navId: 'dashboard', labelOverride: 'Resumen del día', hintOverride: 'KPIs, alertas y siguientes pasos', itemAccentGradient: 'from-blue-400 to-blue-500' },
    ],
    requiredPermissions: ['canViewDashboard'],
    directHref: '/panel-general',
    order: 0,
  },
  {
    id: 'servicio-piso',
    label: 'Servicio en Piso',
    description: 'Tomar pedidos, cocina y auditoría',
    icon: UtensilsCrossed,
    accentColor: 'text-orange-500',
    accentGradient: 'from-orange-500 to-orange-600',
    bgGradient: 'from-orange-500/10 to-orange-600/5',
    itemRefs: [
      { navId: 'comanda', hintOverride: 'Tomar y enviar pedidos', itemAccentGradient: 'from-orange-400 to-orange-500' },
      { navId: 'comanda-cocina', hintOverride: 'Preparar y marcar listo', itemAccentGradient: 'from-red-400 to-red-500' },
      { navId: 'comanda-historial', hintOverride: 'Pedidos cobrados por anfitrión', itemAccentGradient: 'from-amber-400 to-amber-500' },
    ],
    requiredPermissions: ['canTakeFloorOrder', 'canViewKitchenQueue', 'canViewFloorHistory'],
    order: 1,
  },
  {
    id: 'caja-clientes',
    label: 'Caja y Clientes',
    description: 'Cierre de caja, clientes y créditos',
    icon: Wallet,
    accentColor: 'text-emerald-500',
    accentGradient: 'from-emerald-500 to-emerald-600',
    bgGradient: 'from-emerald-500/10 to-emerald-600/5',
    itemRefs: [
      { navId: 'cierre-caja', itemAccentGradient: 'from-emerald-400 to-emerald-500' },
      { navId: 'caja-oficina', itemAccentGradient: 'from-teal-400 to-teal-500' },
      { navId: 'customers', itemAccentGradient: 'from-cyan-400 to-cyan-500' },
      { navId: 'credits', hintOverride: 'Cuentas por cobrar', itemAccentGradient: 'from-sky-400 to-sky-500' },
    ],
    requiredPermissions: ['canManageCierreCaja', 'canManageCustomers', 'canViewCredits'],
    order: 2,
  },
  {
    id: 'ventas',
    label: 'Ventas',
    description: 'Facturas, historial e importación',
    icon: TrendingUp,
    accentColor: 'text-violet-500',
    accentGradient: 'from-violet-500 to-violet-600',
    bgGradient: 'from-violet-500/10 to-violet-600/5',
    itemRefs: [
      { navId: 'invoices', itemAccentGradient: 'from-violet-400 to-violet-500' },
      { navId: 'history', hintOverride: 'Facturas POS / período', itemAccentGradient: 'from-purple-400 to-purple-500' },
      { navId: 'licores', hintOverride: 'Apertura · vendido · quedan', itemAccentGradient: 'from-indigo-400 to-indigo-500' },
      { navId: 'sales-import', itemAccentGradient: 'from-fuchsia-400 to-fuchsia-500' },
    ],
    requiredPermissions: ['canManageInvoices'],
    order: 3,
  },
  {
    id: 'inventario',
    label: 'Inventario',
    description: 'Productos, movimientos y compras',
    icon: Box,
    accentColor: 'text-cyan-500',
    accentGradient: 'from-cyan-500 to-cyan-600',
    bgGradient: 'from-cyan-500/10 to-cyan-600/5',
    itemRefs: [
      { navId: 'products', itemAccentGradient: 'from-cyan-400 to-cyan-500' },
      { navId: 'movements', itemAccentGradient: 'from-teal-400 to-teal-500' },
      { navId: 'servicios-combos', itemAccentGradient: 'from-sky-400 to-sky-500' },
      { navId: 'invoice-upload', itemAccentGradient: 'from-blue-400 to-blue-500' },
      { navId: 'purchases-import', itemAccentGradient: 'from-indigo-400 to-indigo-500' },
      { navId: 'autoconsumo', itemAccentGradient: 'from-slate-400 to-slate-500' },
      { navId: 'alertas-stock', itemAccentGradient: 'from-red-400 to-red-500' },
    ],
    requiredPermissions: ['canManageProducts', 'canManageInventory'],
    order: 4,
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    description: 'Gastos, proveedores y cuentas por pagar',
    icon: DollarSign,
    accentColor: 'text-yellow-500',
    accentGradient: 'from-yellow-500 to-yellow-600',
    bgGradient: 'from-yellow-500/10 to-yellow-600/5',
    itemRefs: [
      { navId: 'expenses', itemAccentGradient: 'from-yellow-400 to-yellow-500' },
      { navId: 'suppliers', itemAccentGradient: 'from-amber-400 to-amber-500' },
      { navId: 'accounts-payable', itemAccentGradient: 'from-orange-400 to-orange-500' },
      { navId: 'tasas', itemAccentGradient: 'from-lime-400 to-lime-500' },
    ],
    requiredPermissions: ['canManageExpenses'],
    order: 5,
  },
  {
    id: 'equipo',
    label: 'Equipo',
    description: 'Nómina y gestión del personal',
    icon: UsersRound,
    accentColor: 'text-pink-500',
    accentGradient: 'from-pink-500 to-pink-600',
    bgGradient: 'from-pink-500/10 to-pink-600/5',
    itemRefs: [
      { navId: 'nomina', itemAccentGradient: 'from-pink-400 to-pink-500' },
    ],
    requiredPermissions: ['canManageTeam'],
    directHref: '/nomina',
    order: 6,
  },
  {
    id: 'sistema',
    label: 'Sistema',
    description: 'Configuración general',
    icon: Settings,
    accentColor: 'text-slate-400',
    accentGradient: 'from-slate-400 to-slate-500',
    bgGradient: 'from-slate-400/10 to-slate-500/5',
    itemRefs: [
      { navId: 'settings', itemAccentGradient: 'from-slate-400 to-slate-500' },
    ],
    requiredPermissions: ['canManageSettings'],
    directHref: '/settings',
    order: 7,
  },
  {
    id: 'fiscal-marfyl',
    label: 'Fiscal MARFYL',
    description: 'Módulo fiscal y declaraciones',
    icon: Scale,
    accentColor: 'text-emerald-600',
    accentGradient: 'from-emerald-600 to-emerald-700',
    bgGradient: 'from-emerald-600/10 to-emerald-700/5',
    itemRefs: [
      { navId: 'fiscal-assistant', itemAccentGradient: 'from-emerald-400 to-emerald-500' },
      { navId: 'fiscal', itemAccentGradient: 'from-teal-400 to-teal-500' },
      { navId: 'fiscal-perfil', itemAccentGradient: 'from-cyan-400 to-cyan-500' },
      { navId: 'fiscal-ventas', itemAccentGradient: 'from-blue-400 to-blue-500' },
      { navId: 'fiscal-compras', itemAccentGradient: 'from-indigo-400 to-indigo-500' },
      { navId: 'fiscal-retenciones', itemAccentGradient: 'from-violet-400 to-violet-500' },
      { navId: 'fiscal-calendario', itemAccentGradient: 'from-amber-400 to-amber-500' },
      { navId: 'fiscal-predecl', itemAccentGradient: 'from-rose-400 to-rose-500' },
    ],
    requiredPermissions: ['canManageFiscal'],
    order: 8,
  },
  {
    id: 'concierto',
    label: 'Concierto',
    description: 'Gestión de eventos y entradas',
    icon: Ticket,
    accentColor: 'text-fuchsia-500',
    accentGradient: 'from-fuchsia-500 to-fuchsia-600',
    bgGradient: 'from-fuchsia-500/10 to-fuchsia-600/5',
    itemRefs: [
      { navId: 'concierto', itemAccentGradient: 'from-fuchsia-400 to-fuchsia-500' },
      { navId: 'concierto-mapa', itemAccentGradient: 'from-pink-400 to-pink-500' },
      { navId: 'concierto-ordenes', itemAccentGradient: 'from-purple-400 to-purple-500' },
      { navId: 'concierto-escaner', itemAccentGradient: 'from-rose-400 to-rose-500' },
    ],
    requiredPermissions: ['canManageCustomers'],
    featureFlag: () => isConcertFeatureEnabled(),
    order: 9,
  },
];

/**
 * Module Registry — Fuente unificada de módulos de galería y navegación.
 *
 * Reemplaza las definiciones duplicadas en:
 *   - `app-nav.ts`  → APP_NAV_ITEMS / APP_NAV_SECTIONS
 *   - `modules.ts`  → GALLERY_MODULES
 *
 * Consumidores:
 *   - Sidebar  → deriveNavItems() + deriveNavSections()
 *   - Galería  → deriveGalleryModules()
 */

import type { LucideIcon } from 'lucide-react';
import {
  Grid2x2,
  ShoppingCart,
  Box,
  PackageMinus,
  BarChart3,
  Users,
  FileText,
  History,
  Beer,
  Wallet,
  CreditCard,
  DollarSign,
  Truck,
  Landmark,
  AlertTriangle,
  TrendingUp,
  Settings,
  UsersRound,
  FileUp,
  Upload,
  CircleDollarSign,
  UtensilsCrossed,
  ChefHat,
  ClipboardList,
  Layers,
  ScrollText,
  Cable,
  LayoutDashboard,
  Scale,
  Sparkles,
  Percent,
  Calendar,
  FileCheck,
} from 'lucide-react';
import type { PermissionKey } from '@/config/permissions';
import type { ProductFeature } from '@/lib/features';
import type { AppNavItem, AppNavSection } from '@/config/app-nav';
import type { GalleryModuleConfig } from '@/config/modules';
import { isProductFeatureEnabled } from '@/lib/features';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModuleNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission: PermissionKey;
  hint?: string;
  feature?: ProductFeature;
  superAdminOnly?: boolean;
  gallery?: {
    labelOverride?: string;
    hintOverride?: string;
    accentGradient?: string;
  };
};

export type ModuleDefinition = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  sectionId?: string;
  order: number;
  accentColor: string;
  accentGradient: string;
  bgGradient: string;
  navItems: ModuleNavItem[];
  requiredPermissions: PermissionKey[];
  featureFlag?: ProductFeature;
  directHref?: string;
};

export type ModuleRegistry = readonly ModuleDefinition[];

// ---------------------------------------------------------------------------
// Registry — All gallery modules in display order
// ---------------------------------------------------------------------------

export const MODULE_REGISTRY: ModuleRegistry = [
  // ── 0. Panel General ──────────────────────────────────────────────────────
  {
    id: 'panel-general',
    label: 'Panel General',
    description: 'Resumen del día, KPIs y alertas',
    icon: LayoutDashboard,
    sectionId: undefined,
    order: 0,
    accentColor: 'text-blue-500',
    accentGradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-500/10 to-blue-600/5',
    navItems: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/',
        icon: Grid2x2,
        permission: 'canViewDashboard',
        hint: 'Resumen general',
        gallery: {
          labelOverride: 'Resumen del día',
          hintOverride: 'KPIs, alertas y siguientes pasos',
          accentGradient: 'from-blue-400 to-blue-500',
        },
      },
    ],
    requiredPermissions: ['canViewDashboard'],
    directHref: '/panel-general',
  },

  // ── 1. Servicio en Piso ───────────────────────────────────────────────────
  {
    id: 'servicio-piso',
    label: 'Servicio en Piso',
    description: 'Tomar pedidos, cocina y auditoría',
    icon: UtensilsCrossed,
    sectionId: 'piso',
    order: 1,
    accentColor: 'text-orange-500',
    accentGradient: 'from-orange-500 to-orange-600',
    bgGradient: 'from-orange-500/10 to-orange-600/5',
    navItems: [
      {
        id: 'comanda',
        label: 'Anfitrión',
        href: '/comanda',
        icon: UtensilsCrossed,
        permission: 'canTakeFloorOrder',
        hint: 'Tomar pedidos y auditoría',
        gallery: {
          hintOverride: 'Tomar y enviar pedidos',
          accentGradient: 'from-orange-400 to-orange-500',
        },
      },
      {
        id: 'comanda-cocina',
        label: 'Cocina · Barra',
        href: '/comanda/cocina',
        icon: ChefHat,
        permission: 'canViewKitchenQueue',
        hint: 'Preparar y marcar listo',
        gallery: {
          hintOverride: 'Preparar y marcar listo',
          accentGradient: 'from-red-400 to-red-500',
        },
      },
    ],
    requiredPermissions: ['canTakeFloorOrder', 'canViewKitchenQueue', 'canViewFloorHistory'],
  },

  // ── 2. Ventas ─────────────────────────────────────────────────────────────
  {
    id: 'ventas',
    label: 'Ventas',
    description: 'Facturas del período. Importar Excel desde el botón de la página',
    icon: TrendingUp,
    sectionId: 'ventas',
    order: 2,
    accentColor: 'text-violet-500',
    accentGradient: 'from-violet-500 to-violet-600',
    bgGradient: 'from-violet-500/10 to-violet-600/5',
    navItems: [
      {
        id: 'invoices',
        label: 'Facturas',
        href: '/invoices',
        icon: FileText,
        permission: 'canManageInvoices',
        gallery: {
          accentGradient: 'from-violet-400 to-violet-500',
        },
      },
    ],
    requiredPermissions: ['canManageInvoices'],
  },

  // ── 3. Licores y combos ───────────────────────────────────────────────────
  {
    id: 'licores',
    label: 'Licores y combos',
    description: 'Control del día, tobos, combos y servicios',
    icon: Beer,
    sectionId: 'ventas',
    order: 3,
    accentColor: 'text-amber-600',
    accentGradient: 'from-amber-500 to-amber-700',
    bgGradient: 'from-amber-500/10 to-amber-700/5',
    navItems: [
      {
        id: 'licores',
        label: 'Licores y combos',
        href: '/licores',
        icon: Beer,
        permission: 'canManageInvoices',
        hint: 'Día, tobos, combos y servicios',
        gallery: {
          hintOverride: 'Inicio · vendido · quedan',
          accentGradient: 'from-amber-400 to-amber-600',
        },
      },
    ],
    requiredPermissions: ['canManageInvoices'],
    directHref: '/licores',
  },

  // ── 4. Inventario ─────────────────────────────────────────────────────────
  {
    id: 'inventario',
    label: 'Inventario',
    description: 'Productos, movimientos y compras',
    icon: Box,
    sectionId: 'inventario',
    order: 4,
    accentColor: 'text-cyan-500',
    accentGradient: 'from-cyan-500 to-cyan-600',
    bgGradient: 'from-cyan-500/10 to-cyan-600/5',
    navItems: [
      {
        id: 'products',
        label: 'Inventario',
        href: '/products',
        icon: Box,
        permission: 'canManageProducts',
        gallery: {
          accentGradient: 'from-cyan-400 to-cyan-500',
        },
      },
      {
        id: 'movements',
        label: 'Movimientos',
        href: '/inventory/movements',
        icon: PackageMinus,
        permission: 'canManageInventory',
        gallery: {
          accentGradient: 'from-teal-400 to-teal-500',
        },
      },
      {
        id: 'invoice-upload',
        label: 'Compras',
        href: '/inventory/invoice-upload',
        icon: FileUp,
        permission: 'canManageInventory',
        hint: 'A mano, PDF o Excel',
        gallery: {
          accentGradient: 'from-blue-400 to-blue-500',
        },
      },
    ],
    requiredPermissions: ['canManageProducts', 'canManageInventory'],
  },

  // ── 5. Finanzas ───────────────────────────────────────────────────────────
  {
    id: 'finanzas',
    label: 'Finanzas',
    description: 'Gastos, proveedores y cuentas por pagar',
    icon: DollarSign,
    sectionId: 'finanzas',
    order: 5,
    accentColor: 'text-yellow-500',
    accentGradient: 'from-yellow-500 to-yellow-600',
    bgGradient: 'from-yellow-500/10 to-yellow-600/5',
    navItems: [
      {
        id: 'expenses',
        label: 'Gastos',
        href: '/expenses',
        icon: DollarSign,
        permission: 'canManageExpenses',
        gallery: {
          accentGradient: 'from-yellow-400 to-yellow-500',
        },
      },
      {
        id: 'suppliers',
        label: 'Proveedores',
        href: '/suppliers',
        icon: Truck,
        permission: 'canManageExpenses',
        feature: 'suppliersNav',
        gallery: {
          accentGradient: 'from-amber-400 to-amber-500',
        },
      },
      {
        id: 'accounts-payable',
        label: 'Cuentas por pagar',
        href: '/accounts-payable',
        icon: Landmark,
        permission: 'canManageExpenses',
        feature: 'accountsPayable',
        gallery: {
          accentGradient: 'from-orange-400 to-orange-500',
        },
      },
      {
        id: 'tasas',
        label: 'Tasas BCV',
        href: '/tasas',
        icon: TrendingUp,
        permission: 'canManageExpenses',
        feature: 'tasas',
        gallery: {
          accentGradient: 'from-lime-400 to-lime-500',
        },
      },
    ],
    requiredPermissions: ['canManageExpenses'],
  },

  // ── 6. Equipo ─────────────────────────────────────────────────────────────
  {
    id: 'equipo',
    label: 'Equipo',
    description: 'Nómina y gestión del personal',
    icon: UsersRound,
    sectionId: 'rrhh',
    order: 6,
    accentColor: 'text-pink-500',
    accentGradient: 'from-pink-500 to-pink-600',
    bgGradient: 'from-pink-500/10 to-pink-600/5',
    navItems: [
      {
        id: 'nomina',
        label: 'Nómina',
        href: '/nomina',
        icon: UsersRound,
        permission: 'canManageTeam',
        feature: 'payroll',
        gallery: {
          accentGradient: 'from-pink-400 to-pink-500',
        },
      },
    ],
    requiredPermissions: ['canManageTeam'],
    directHref: '/nomina',
    featureFlag: 'payroll',
  },

  // ── 7. Hybrid POS ─────────────────────────────────────────────────────────
  {
    id: 'hybrid',
    label: 'Hybrid POS',
    description: 'Consultar Hybrid (solo lectura)',
    icon: Cable,
    sectionId: 'sistema',
    order: 7,
    accentColor: 'text-teal-400',
    accentGradient: 'from-teal-400 to-teal-500',
    bgGradient: 'from-teal-400/10 to-teal-500/5',
    navItems: [
      {
        id: 'hybrid',
        label: 'Hybrid POS',
        href: '/hybrid/conexion',
        icon: Cable,
        permission: 'canManageInvoices',
        superAdminOnly: true,
        hint: 'Consultar Hybrid (solo lectura)',
        gallery: {
          hintOverride: 'Solo lectura · Super Admin',
          accentGradient: 'from-teal-400 to-teal-500',
        },
      },
    ],
    requiredPermissions: ['canManageSettings'],
  },

  // ── 8. Sistema ────────────────────────────────────────────────────────────
  {
    id: 'sistema',
    label: 'Sistema',
    description: 'Configuración y auditoría',
    icon: Settings,
    sectionId: 'sistema',
    order: 8,
    accentColor: 'text-slate-400',
    accentGradient: 'from-slate-400 to-slate-500',
    bgGradient: 'from-slate-400/10 to-slate-500/5',
    navItems: [
      {
        id: 'settings',
        label: 'Configuración',
        href: '/settings',
        icon: Settings,
        permission: 'canManageSettings',
        gallery: {
          accentGradient: 'from-slate-400 to-slate-500',
        },
      },
      {
        id: 'trazabilidad',
        label: 'Trazabilidad',
        href: '/trazabilidad',
        icon: ScrollText,
        permission: 'canManageSettings',
        superAdminOnly: true,
        hint: 'Quién cambió qué',
        gallery: {
          hintOverride: 'Quién cambió qué',
          accentGradient: 'from-indigo-400 to-indigo-500',
        },
      },
    ],
    requiredPermissions: ['canManageSettings'],
  },

  // ── 9. Fiscal MARFYL ──────────────────────────────────────────────────────
  {
    id: 'fiscal-marfyl',
    label: 'Fiscal MARFYL',
    description: 'Módulo fiscal y declaraciones',
    icon: Scale,
    sectionId: undefined,
    order: 9,
    accentColor: 'text-emerald-600',
    accentGradient: 'from-emerald-600 to-emerald-700',
    bgGradient: 'from-emerald-600/10 to-emerald-700/5',
    navItems: [
      {
        id: 'fiscal-assistant',
        label: 'Asistente IA',
        href: '/assistant',
        icon: Sparkles,
        permission: 'canManageFiscal',
        hint: 'Chat fiscal Gemini',
        gallery: {
          accentGradient: 'from-emerald-400 to-emerald-500',
        },
      },
      {
        id: 'fiscal',
        label: 'Panel fiscal',
        href: '/fiscal',
        icon: BarChart3,
        permission: 'canManageFiscal',
        hint: 'KPIs y agenda',
        gallery: {
          accentGradient: 'from-teal-400 to-teal-500',
        },
      },
      {
        id: 'fiscal-perfil',
        label: 'Perfil contribuyente',
        href: '/fiscal/perfil',
        icon: Users,
        permission: 'canManageFiscal',
        gallery: {
          accentGradient: 'from-cyan-400 to-cyan-500',
        },
      },
      {
        id: 'fiscal-ventas',
        label: 'Libro de ventas',
        href: '/fiscal/libro-ventas',
        icon: FileText,
        permission: 'canManageFiscal',
        gallery: {
          accentGradient: 'from-blue-400 to-blue-500',
        },
      },
      {
        id: 'fiscal-compras',
        label: 'Libro de compras',
        href: '/fiscal/libro-compras',
        icon: ShoppingCart,
        permission: 'canManageFiscal',
        gallery: {
          accentGradient: 'from-indigo-400 to-indigo-500',
        },
      },
      {
        id: 'fiscal-retenciones',
        label: 'Retenciones IVA',
        href: '/fiscal/retenciones',
        icon: Percent,
        permission: 'canManageFiscal',
        gallery: {
          accentGradient: 'from-violet-400 to-violet-500',
        },
      },
      {
        id: 'fiscal-calendario',
        label: 'Calendario SENIAT',
        href: '/fiscal/calendario',
        icon: Calendar,
        permission: 'canManageFiscal',
        gallery: {
          accentGradient: 'from-amber-400 to-amber-500',
        },
      },
      {
        id: 'fiscal-predecl',
        label: 'Pre-declaración',
        href: '/fiscal/predeclaracion',
        icon: FileCheck,
        permission: 'canManageFiscal',
        gallery: {
          accentGradient: 'from-rose-400 to-rose-500',
        },
      },
    ],
    requiredPermissions: ['canManageFiscal'],
    featureFlag: 'fiscal',
  },
];

// ---------------------------------------------------------------------------
// Standalone nav items — NOT part of any gallery module
// ---------------------------------------------------------------------------

export const STANDALONE_NAV_ITEMS: (ModuleNavItem & { sectionId?: string })[] = [
  {
    id: 'pos',
    label: 'Caja / POS',
    href: '/pos',
    icon: ShoppingCart,
    permission: 'canAccessPOS',
    hint: 'Cobrar e inventario vendible',
    sectionId: 'ventas',
  },
  {
    id: 'cierre-caja',
    label: 'Cierre de caja',
    href: '/cierre-caja',
    icon: Wallet,
    permission: 'canManageCierreCaja',
    sectionId: 'ventas',
  },
  {
    id: 'caja-oficina',
    label: 'Caja oficina',
    href: '/caja-oficina',
    icon: Landmark,
    permission: 'canManageCierreCaja',
    feature: 'cajaOficina',
    sectionId: 'ventas',
  },
  {
    id: 'customers',
    label: 'Clientes',
    href: '/customers',
    icon: Users,
    permission: 'canManageCustomers',
    feature: 'customers',
    sectionId: 'ventas',
  },
  {
    id: 'credits',
    label: 'Cuentas por cobrar',
    href: '/credits',
    icon: CreditCard,
    permission: 'canViewCredits',
    feature: 'credits',
    sectionId: 'ventas',
  },
  {
    id: 'history',
    label: 'Historial de ventas',
    href: '/invoices',
    icon: History,
    permission: 'canManageInvoices',
    hint: 'Facturas POS / período',
    sectionId: 'ventas',
  },
  {
    id: 'sales-import',
    label: 'Importar ventas POS',
    href: '/importar?tipo=ventas',
    icon: Upload,
    permission: 'canManageInventory',
    sectionId: 'ventas',
  },
  {
    id: 'servicios-combos',
    label: 'Combos y servicios',
    href: '/licores?tab=combos',
    icon: Layers,
    permission: 'canManageProducts',
    hint: 'Paquetes y servicios',
    sectionId: 'inventario',
  },
  {
    id: 'autoconsumo',
    label: 'Autoconsumo',
    href: '/inventory/movements',
    icon: BarChart3,
    permission: 'canManageInventory',
    sectionId: 'inventario',
  },
  {
    id: 'alertas-stock',
    label: 'Alertas de stock',
    href: '/products?stock=bajo',
    icon: AlertTriangle,
    permission: 'canManageInventory',
    sectionId: 'inventario',
  },
  {
    id: 'comanda-historial',
    label: 'Auditoría',
    href: '/comanda/historial',
    icon: ClipboardList,
    permission: 'canViewFloorHistory',
    hint: 'Pedidos cobrados por anfitrión',
    sectionId: 'piso',
  },
];

// ---------------------------------------------------------------------------
// Derivation functions
// ---------------------------------------------------------------------------

/**
 * Derive AppNavItem[] from the registry + standalone items.
 * Use this to feed the sidebar.
 */
export function deriveNavItems(
  registry: ModuleRegistry,
  standaloneItems?: (ModuleNavItem & { sectionId?: string })[],
): AppNavItem[] {
  const items: AppNavItem[] = [];

  // Items from modules
  for (const mod of registry) {
    for (const item of mod.navItems) {
      items.push({
        id: item.id,
        label: item.label,
        href: item.href,
        icon: item.icon,
        permission: item.permission,
        hint: item.hint,
        feature: item.feature,
        superAdminOnly: item.superAdminOnly,
      });
    }
  }

  // Standalone items
  if (standaloneItems) {
    for (const item of standaloneItems) {
      items.push({
        id: item.id,
        label: item.label,
        href: item.href,
        icon: item.icon,
        permission: item.permission,
        hint: item.hint,
        feature: item.feature,
        superAdminOnly: item.superAdminOnly,
      });
    }
  }

  return items;
}

/**
 * Derive GalleryModuleConfig[] from the registry.
 * Use this to feed the module gallery.
 */
export function deriveGalleryModules(registry: ModuleRegistry): GalleryModuleConfig[] {
  return registry.map((mod) => ({
    id: mod.id,
    label: mod.label,
    description: mod.description,
    icon: mod.icon,
    accentColor: mod.accentColor,
    accentGradient: mod.accentGradient,
    bgGradient: mod.bgGradient,
    itemRefs: mod.navItems.map((item) => ({
      navId: item.id,
      labelOverride: item.gallery?.labelOverride,
      hintOverride: item.gallery?.hintOverride,
      itemAccentGradient: item.gallery?.accentGradient,
    })),
    requiredPermissions: mod.requiredPermissions,
    featureFlag: mod.featureFlag
      ? () => isProductFeatureEnabled(mod.featureFlag!)
      : undefined,
    directHref: mod.directHref,
    order: mod.order,
  }));
}

/**
 * Derive AppNavSection[] from the registry + standalone items.
 * Use this to build sidebar sections.
 */
export function deriveNavSections(
  registry: ModuleRegistry,
  standaloneItems?: (ModuleNavItem & { sectionId?: string })[],
): AppNavSection[] {
  const sectionMap = new Map<
    string,
    { label: string; icon: LucideIcon; itemIds: string[]; defaultOpen?: boolean }
  >();

  // Known sections with their labels and icons
  const knownSections: Record<
    string,
    { label: string; icon: LucideIcon; defaultOpen?: boolean }
  > = {
    piso: { label: 'Servicio en piso', icon: UtensilsCrossed, defaultOpen: true },
    ventas: { label: 'Ventas y control', icon: CircleDollarSign },
    inventario: { label: 'Inventario', icon: Box },
    finanzas: { label: 'Finanzas', icon: DollarSign },
    rrhh: { label: 'Equipo', icon: UsersRound },
    sistema: { label: 'Sistema', icon: Settings },
  };

  // Process modules
  for (const mod of registry) {
    if (mod.sectionId && knownSections[mod.sectionId]) {
      if (!sectionMap.has(mod.sectionId)) {
        sectionMap.set(mod.sectionId, {
          ...knownSections[mod.sectionId],
          itemIds: [],
        });
      }
      const section = sectionMap.get(mod.sectionId)!;
      for (const item of mod.navItems) {
        if (!section.itemIds.includes(item.id)) {
          section.itemIds.push(item.id);
        }
      }
    }
  }

  // Process standalone items
  if (standaloneItems) {
    for (const item of standaloneItems) {
      if (item.sectionId && knownSections[item.sectionId]) {
        if (!sectionMap.has(item.sectionId)) {
          sectionMap.set(item.sectionId, {
            ...knownSections[item.sectionId],
            itemIds: [],
          });
        }
        const section = sectionMap.get(item.sectionId)!;
        if (!section.itemIds.includes(item.id)) {
          section.itemIds.push(item.id);
        }
      }
    }
  }

  return Array.from(sectionMap.entries()).map(([id, data]) => ({
    id,
    label: data.label,
    icon: data.icon,
    itemIds: data.itemIds,
    defaultOpen: data.defaultOpen,
  }));
}

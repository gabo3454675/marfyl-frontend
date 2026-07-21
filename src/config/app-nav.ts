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
} from 'lucide-react';
import type { PermissionKey } from '@/config/permissions';

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

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Grid2x2,
    href: '/',
    permission: 'canViewDashboard',
    hint: 'Resumen general',
  },
  {
    id: 'pos',
    label: 'Caja / POS',
    icon: ShoppingCart,
    href: '/pos',
    permission: 'canAccessPOS',
    hint: 'Cobrar e inventario vendible',
  },

  // —— Servicio en piso ——
  {
    id: 'comanda',
    label: 'Anfitrión',
    icon: UtensilsCrossed,
    href: '/comanda',
    permission: 'canTakeFloorOrder',
    hint: 'Tomar y enviar pedidos',
  },
  {
    id: 'comanda-cocina',
    label: 'Cocina · Barra',
    icon: ChefHat,
    href: '/comanda/cocina',
    permission: 'canViewKitchenQueue',
    hint: 'Preparar y marcar listo',
  },
  {
    id: 'comanda-historial',
    label: 'Auditoría',
    icon: ClipboardList,
    href: '/comanda/historial',
    permission: 'canViewFloorHistory',
    hint: 'Pedidos cobrados por anfitrión',
  },

  // —— Caja del día ——
  {
    id: 'cierre-caja',
    label: 'Cierre de caja',
    icon: Wallet,
    href: '/cierre-caja',
    permission: 'canManageCierreCaja',
  },
  {
    id: 'caja-oficina',
    label: 'Caja oficina',
    icon: Landmark,
    href: '/caja-oficina',
    permission: 'canManageCierreCaja',
  },
  {
    id: 'customers',
    label: 'Clientes',
    icon: Users,
    href: '/customers',
    permission: 'canManageCustomers',
  },
  {
    id: 'credits',
    label: 'Cuentas por cobrar',
    icon: CreditCard,
    href: '/credits',
    permission: 'canViewCredits',
  },

  // —— Ventas y control ——
  {
    id: 'invoices',
    label: 'Facturas',
    icon: FileText,
    href: '/invoices',
    permission: 'canManageInvoices',
  },
  {
    id: 'history',
    label: 'Historial de ventas',
    icon: History,
    href: '/history',
    permission: 'canManageInvoices',
    hint: 'Facturas POS / período',
  },
  {
    id: 'licores',
    label: 'Licores y tobos',
    icon: Beer,
    href: '/licores',
    permission: 'canManageInvoices',
    hint: 'Apertura · vendido · quedan',
  },
  {
    id: 'sales-import',
    label: 'Importar ventas POS',
    icon: Upload,
    href: '/sales/import',
    permission: 'canManageInventory',
  },

  // —— Inventario ——
  {
    id: 'products',
    label: 'Inventario',
    icon: Box,
    href: '/products',
    permission: 'canManageProducts',
  },
  {
    id: 'movements',
    label: 'Movimientos',
    icon: PackageMinus,
    href: '/inventory/movements',
    permission: 'canManageInventory',
  },
  {
    id: 'invoice-upload',
    label: 'Subir factura compra',
    icon: FileUp,
    href: '/inventory/invoice-upload',
    permission: 'canManageInventory',
  },
  {
    id: 'purchases-import',
    label: 'Importar compras',
    icon: Upload,
    href: '/inventory/purchases-import',
    permission: 'canManageInventory',
  },
  {
    id: 'autoconsumo',
    label: 'Autoconsumo',
    icon: BarChart3,
    href: '/autoconsumo',
    permission: 'canManageInventory',
  },
  {
    id: 'alertas-stock',
    label: 'Alertas de stock',
    icon: AlertTriangle,
    href: '/alertas-stock',
    permission: 'canManageInventory',
  },

  // —— Finanzas ——
  {
    id: 'expenses',
    label: 'Gastos',
    icon: DollarSign,
    href: '/expenses',
    permission: 'canManageExpenses',
  },
  {
    id: 'suppliers',
    label: 'Proveedores',
    icon: Truck,
    href: '/suppliers',
    permission: 'canManageExpenses',
  },
  {
    id: 'accounts-payable',
    label: 'Cuentas por pagar',
    icon: Landmark,
    href: '/accounts-payable',
    permission: 'canManageExpenses',
  },
  {
    id: 'tasas',
    label: 'Tasas BCV',
    icon: TrendingUp,
    href: '/tasas',
    permission: 'canManageExpenses',
  },

  // —— Equipo / sistema ——
  {
    id: 'nomina',
    label: 'Nómina',
    icon: UsersRound,
    href: '/nomina',
    permission: 'canManageTeam',
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: Settings,
    href: '/settings',
    permission: 'canManageSettings',
  },
];

/**
 * Menú por estación / responsabilidad (solo se muestran ítems con permiso).
 */
export const APP_NAV_SECTIONS: AppNavSection[] = [
  {
    id: 'piso',
    label: 'Servicio en piso',
    icon: UtensilsCrossed,
    defaultOpen: true,
    itemIds: ['comanda', 'comanda-cocina', 'comanda-historial'],
  },
  {
    id: 'caja',
    label: 'Caja del día',
    icon: Wallet,
    defaultOpen: true,
    itemIds: ['cierre-caja', 'caja-oficina', 'customers', 'credits'],
  },
  {
    id: 'ventas',
    label: 'Ventas y control',
    icon: CircleDollarSign,
    itemIds: ['invoices', 'history', 'licores', 'sales-import'],
  },
  {
    id: 'inventario',
    label: 'Inventario',
    icon: Box,
    itemIds: [
      'products',
      'movements',
      'invoice-upload',
      'purchases-import',
      'autoconsumo',
      'alertas-stock',
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: DollarSign,
    itemIds: ['expenses', 'suppliers', 'accounts-payable', 'tasas'],
  },
  {
    id: 'rrhh',
    label: 'Equipo',
    icon: UsersRound,
    itemIds: ['nomina'],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: Settings,
    itemIds: ['settings'],
  },
];

export function resolveAppNavId(pathname: string): string {
  if (pathname === '/' || pathname === '/') return 'dashboard';
  if (pathname.startsWith('/pos')) return 'pos';
  if (pathname.startsWith('/comanda/historial')) return 'comanda-historial';
  if (pathname.startsWith('/comanda/cocina')) return 'comanda-cocina';
  if (pathname.startsWith('/comanda')) return 'comanda';
  if (pathname.startsWith('/servicios-combos')) return 'products';
  if (pathname.startsWith('/products')) return 'products';
  if (pathname.startsWith('/inventory/movements')) return 'movements';
  if (pathname.startsWith('/autoconsumo')) return 'autoconsumo';
  if (pathname.startsWith('/alertas-stock')) return 'alertas-stock';
  if (pathname.startsWith('/inventory/invoice-upload')) return 'invoice-upload';
  if (pathname.startsWith('/inventory/purchases-import')) return 'purchases-import';
  if (pathname.startsWith('/inventory')) return 'products';
  if (pathname.startsWith('/customers')) return 'customers';
  if (pathname.startsWith('/sales/import')) return 'sales-import';
  if (pathname.startsWith('/invoices')) return 'invoices';
  if (pathname.startsWith('/history')) return 'history';
  if (pathname.startsWith('/licores')) return 'licores';
  if (pathname.startsWith('/cierre-caja')) return 'cierre-caja';
  if (pathname.startsWith('/caja-oficina')) return 'caja-oficina';
  if (pathname.startsWith('/credits')) return 'credits';
  if (pathname.startsWith('/expenses')) return 'expenses';
  if (pathname.startsWith('/suppliers')) return 'suppliers';
  if (pathname.startsWith('/accounts-payable')) return 'accounts-payable';
  if (pathname.startsWith('/tasas')) return 'tasas';
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

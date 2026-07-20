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

/** Accesos frecuentes — siempre visibles, sin desplegable */
export const APP_NAV_QUICK_ACCESS_IDS = ['dashboard', 'pos'] as const;

export const APP_NAV_ITEMS: AppNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Grid2x2, href: '/', permission: 'canViewDashboard' },
  { id: 'pos', label: 'POS', icon: ShoppingCart, href: '/pos', permission: 'canAccessPOS' },
  { id: 'products', label: 'Inventario', icon: Box, href: '/products', permission: 'canManageProducts' },
  { id: 'movements', label: 'Movimientos inventario', icon: PackageMinus, href: '/inventory/movements', permission: 'canManageInventory' },
  { id: 'invoice-upload', label: 'Subir Factura', icon: FileUp, href: '/inventory/invoice-upload', permission: 'canManageInventory' },
  { id: 'purchases-import', label: 'Importar compras', icon: Upload, href: '/inventory/purchases-import', permission: 'canManageInventory' },
  { id: 'autoconsumo', label: 'Autoconsumo', icon: BarChart3, href: '/autoconsumo', permission: 'canManageInventory' },
  { id: 'alertas-stock', label: 'Alertas inventario', icon: AlertTriangle, href: '/alertas-stock', permission: 'canManageInventory' },
  { id: 'customers', label: 'Clientes', icon: Users, href: '/customers', permission: 'canManageCustomers' },
  { id: 'invoices', label: 'Facturas', icon: FileText, href: '/invoices', permission: 'canManageInvoices' },
  { id: 'sales-import', label: 'Importar ventas POS', icon: Upload, href: '/sales/import', permission: 'canManageInventory' },
  { id: 'history', label: 'Historial de ventas', icon: History, href: '/history', permission: 'canManageInvoices' },
  { id: 'cierre-caja', label: 'Cierre de caja', icon: Wallet, href: '/cierre-caja', permission: 'canManageCierreCaja' },
  { id: 'caja-oficina', label: 'Caja oficina', icon: Landmark, href: '/caja-oficina', permission: 'canManageCierreCaja' },
  { id: 'credits', label: 'Cuentas por cobar', icon: CreditCard, href: '/credits', permission: 'canViewCredits' },
  { id: 'expenses', label: 'Gastos', icon: DollarSign, href: '/expenses', permission: 'canManageExpenses' },
  { id: 'suppliers', label: 'Proveedores', icon: Truck, href: '/suppliers', permission: 'canManageExpenses' },
  { id: 'accounts-payable', label: 'Cuentas por pagar', icon: Landmark, href: '/accounts-payable', permission: 'canManageExpenses' },
  { id: 'tasas', label: 'Tasas BCV / Diferencial', icon: TrendingUp, href: '/tasas', permission: 'canManageExpenses' },
  { id: 'settings', label: 'Configuración', icon: Settings, href: '/settings', permission: 'canManageSettings' },
  { id: 'nomina', label: 'Nómina', icon: UsersRound, href: '/nomina', permission: 'canManageTeam' },
];

export const APP_NAV_SECTIONS: AppNavSection[] = [
  {
    id: 'ventas',
    label: 'Vender y cobrar',
    icon: CircleDollarSign,
    itemIds: ['invoices', 'sales-import', 'history', 'cierre-caja', 'caja-oficina', 'credits', 'customers'],
  },
  {
    id: 'inventario',
    label: 'Inventario',
    icon: Box,
    itemIds: ['products', 'movements', 'invoice-upload', 'purchases-import', 'autoconsumo', 'alertas-stock'],
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

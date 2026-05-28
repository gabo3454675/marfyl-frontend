import type { LucideIcon } from 'lucide-react';
import {
  Grid2x2,
  ShoppingCart,
  Box,
  Wine,
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
} from 'lucide-react';

export type NavPermission =
  | 'canViewDashboard'
  | 'canManageCustomers'
  | 'canManageProducts'
  | 'canManageInventory'
  | 'canManageExpenses'
  | 'canManageTeam'
  | 'canManageFiscal';

export type AppNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission: NavPermission;
};

export type AppNavSection = {
  id: string;
  label: string;
  itemIds: string[];
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Grid2x2, href: '/', permission: 'canViewDashboard' },
  { id: 'pos', label: 'POS', icon: ShoppingCart, href: '/pos', permission: 'canManageCustomers' },
  { id: 'products', label: 'Inventario', icon: Box, href: '/products', permission: 'canManageProducts' },
  { id: 'servicios-combos', label: 'Servicios y combos', icon: Wine, href: '/servicios-combos', permission: 'canManageProducts' },
  { id: 'movements', label: 'Movimientos inventario', icon: PackageMinus, href: '/inventory/movements', permission: 'canManageInventory' },
  { id: 'autoconsumo', label: 'Autoconsumo', icon: BarChart3, href: '/autoconsumo', permission: 'canManageInventory' },
  { id: 'alertas-stock', label: 'Alertas inventario', icon: AlertTriangle, href: '/alertas-stock', permission: 'canManageInventory' },
  { id: 'customers', label: 'Clientes', icon: Users, href: '/customers', permission: 'canManageCustomers' },
  { id: 'invoices', label: 'Facturas', icon: FileText, href: '/invoices', permission: 'canManageCustomers' },
  { id: 'history', label: 'Historial de ventas', icon: History, href: '/history', permission: 'canManageCustomers' },
  { id: 'cierre-caja', label: 'Cierre de caja', icon: Wallet, href: '/cierre-caja', permission: 'canManageCustomers' },
  { id: 'credits', label: 'Cuentas por cobar', icon: CreditCard, href: '/credits', permission: 'canManageCustomers' },
  { id: 'expenses', label: 'Gastos', icon: DollarSign, href: '/expenses', permission: 'canManageExpenses' },
  { id: 'suppliers', label: 'Proveedores', icon: Truck, href: '/suppliers', permission: 'canManageExpenses' },
  { id: 'accounts-payable', label: 'Cuentas por pagar', icon: Landmark, href: '/accounts-payable', permission: 'canManageExpenses' },
  { id: 'tasas', label: 'Tasas BCV / Diferencial', icon: TrendingUp, href: '/tasas', permission: 'canManageExpenses' },
  { id: 'settings', label: 'Configuración', icon: Settings, href: '/settings', permission: 'canManageTeam' },
];

export const APP_NAV_SECTIONS: AppNavSection[] = [
  {
    id: 'ventas',
    label: 'Ventas y caja',
    itemIds: ['dashboard', 'pos', 'invoices', 'history', 'cierre-caja'],
  },
  {
    id: 'inventario',
    label: 'Inventario',
    itemIds: ['products', 'servicios-combos', 'movements', 'autoconsumo', 'alertas-stock'],
  },
  {
    id: 'finanzas',
    label: 'Clientes y finanzas',
    itemIds: ['customers', 'credits', 'expenses', 'suppliers', 'accounts-payable'],
  },
  {
    id: 'config',
    label: 'Configuración',
    itemIds: ['tasas', 'settings'],
  },
];

export function resolveAppNavId(pathname: string): string {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/pos')) return 'pos';
  if (pathname.startsWith('/servicios-combos')) return 'servicios-combos';
  if (pathname.startsWith('/products')) return 'products';
  if (pathname.startsWith('/inventory/movements')) return 'movements';
  if (pathname.startsWith('/autoconsumo')) return 'autoconsumo';
  if (pathname.startsWith('/alertas-stock')) return 'alertas-stock';
  if (pathname.startsWith('/inventory')) return 'products';
  if (pathname.startsWith('/customers')) return 'customers';
  if (pathname.startsWith('/invoices')) return 'invoices';
  if (pathname.startsWith('/history')) return 'history';
  if (pathname.startsWith('/cierre-caja')) return 'cierre-caja';
  if (pathname.startsWith('/credits')) return 'credits';
  if (pathname.startsWith('/expenses')) return 'expenses';
  if (pathname.startsWith('/suppliers')) return 'suppliers';
  if (pathname.startsWith('/accounts-payable')) return 'accounts-payable';
  if (pathname.startsWith('/tasas')) return 'tasas';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'dashboard';
}

export function getNavItem(id: string) {
  return APP_NAV_ITEMS.find((i) => i.id === id);
}

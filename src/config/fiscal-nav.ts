import {
  BarChart3,
  Users,
  FileText,
  ShoppingCart,
  Percent,
  Calendar,
  FileCheck,
  Scale,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export type FiscalNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

/** Navegación unificada del módulo Fiscal MARFYL (sidebar, tabs, bottom sheet). */
export const FISCAL_NAV_ITEMS: FiscalNavItem[] = [
  { id: 'fiscal-assistant', label: 'Asistente IA', href: '/assistant', icon: Sparkles, description: 'Chat fiscal Gemini' },
  { id: 'fiscal', label: 'Panel fiscal', href: '/fiscal', icon: BarChart3, description: 'KPIs y agenda' },
  { id: 'fiscal-perfil', label: 'Perfil contribuyente', href: '/fiscal/perfil', icon: Users },
  { id: 'fiscal-ventas', label: 'Libro de ventas', href: '/fiscal/libro-ventas', icon: FileText },
  { id: 'fiscal-compras', label: 'Libro de compras', href: '/fiscal/libro-compras', icon: ShoppingCart },
  { id: 'fiscal-retenciones', label: 'Retenciones IVA', href: '/fiscal/retenciones', icon: Percent },
  { id: 'fiscal-calendario', label: 'Calendario SENIAT', href: '/fiscal/calendario', icon: Calendar },
  { id: 'fiscal-predecl', label: 'Pre-declaración', href: '/fiscal/predeclaracion', icon: FileCheck },
];

export const FISCAL_MODULE_LABEL = 'Fiscal MARFYL';

export const FISCAL_NAV_GROUP = {
  id: 'fiscal-marfyl',
  label: FISCAL_MODULE_LABEL,
  icon: Scale,
} as const;

export function resolveFiscalNavId(pathname: string): string {
  if (pathname === '/assistant' || pathname.startsWith('/assistant/')) return 'fiscal-assistant';
  if (pathname.startsWith('/fiscal/libro-compras')) return 'fiscal-compras';
  if (pathname.startsWith('/fiscal/libro-ventas')) return 'fiscal-ventas';
  if (pathname.startsWith('/fiscal/retenciones')) return 'fiscal-retenciones';
  if (pathname.startsWith('/fiscal/calendario')) return 'fiscal-calendario';
  if (pathname.startsWith('/fiscal/predeclaracion')) return 'fiscal-predecl';
  if (pathname.startsWith('/fiscal/perfil')) return 'fiscal-perfil';
  if (pathname.startsWith('/fiscal')) return 'fiscal';
  return '';
}

export function isFiscalRoute(pathname: string): boolean {
  return (
    pathname === '/fiscal' ||
    pathname.startsWith('/fiscal/') ||
    pathname === '/assistant' ||
    pathname.startsWith('/assistant/')
  );
}

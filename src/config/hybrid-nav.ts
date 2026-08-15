import { FileSearch } from 'lucide-react';
import type { AppNavItem } from '@/config/app-nav';

export const HYBRID_NAV_ITEMS: AppNavItem[] = [
  {
    id: 'hybrid-ventas',
    label: 'Consulta Hybrid',
    icon: FileSearch,
    href: '/hybrid/ventas',
    permission: 'canManageInvoices',
    hint: 'Ventas Hybrid (solo lectura)',
  },
];

export function resolveHybridNavId(pathname: string): string | null {
  if (pathname.startsWith('/hybrid/ventas')) return 'hybrid-ventas';
  if (pathname.startsWith('/hybrid')) return 'hybrid-ventas';
  return null;
}

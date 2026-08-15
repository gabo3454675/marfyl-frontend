import { FileSearch } from 'lucide-react';
import type { AppNavItem } from '@/config/app-nav';

export const HYBRID_NAV_ITEMS: AppNavItem[] = [
  {
    id: 'hybrid',
    label: 'Hybrid',
    icon: FileSearch,
    href: '/hybrid/conexion',
    permission: 'canManageInvoices',
    hybridOrgOnly: true,
    hint: 'Consulta Hybrid (solo lectura)',
  },
];

export function resolveHybridNavId(pathname: string): string | null {
  if (pathname.startsWith('/hybrid')) return 'hybrid';
  return null;
}

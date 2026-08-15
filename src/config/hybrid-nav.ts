import { Cable } from 'lucide-react';
import type { AppNavItem } from '@/config/app-nav';

export const HYBRID_NAV_ITEMS: AppNavItem[] = [
  {
    id: 'hybrid',
    label: 'Hybrid POS',
    icon: Cable,
    href: '/hybrid/conexion',
    permission: 'canManageInvoices',
    superAdminOnly: true,
    hint: 'Consultar Hybrid (solo lectura)',
  },
];

export function resolveHybridNavId(pathname: string): string | null {
  if (pathname.startsWith('/hybrid/conexion')) return 'hybrid';
  if (pathname.startsWith('/hybrid/ventas')) return 'hybrid';
  if (pathname.startsWith('/hybrid')) return 'hybrid';
  return null;
}

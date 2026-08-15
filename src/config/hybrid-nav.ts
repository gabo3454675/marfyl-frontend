import { FileSearch } from 'lucide-react';
import type { AppNavItem } from '@/config/app-nav';

export const HYBRID_NAV_ITEMS: AppNavItem[] = [
  {
    id: 'hybrid-ventas',
    label: 'Consulta Hybrid',
    icon: FileSearch,
    href: '/hybrid/ventas',
    permission: 'canManageInvoices',
    hybridOrgOnly: true,
    hint: 'Ventas Hybrid (solo lectura)',
  },
];

export function resolveHybridNavId(pathname: string): string | null {
  // Conexión SA vive en app-nav (sistema), no en el menú Hybrid Monddy.
  if (pathname.startsWith('/hybrid/conexion')) return null;
  if (pathname.startsWith('/hybrid/ventas')) return 'hybrid-ventas';
  if (pathname.startsWith('/hybrid')) return 'hybrid-ventas';
  return null;
}

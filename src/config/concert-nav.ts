import { LayoutGrid, QrCode, ScanLine, Ticket } from 'lucide-react';
import type { AppNavItem } from '@/config/app-nav';

export const CONCERT_NAV_ITEMS: AppNavItem[] = [
  {
    id: 'concierto',
    label: 'Concierto',
    icon: Ticket,
    href: '/concierto',
    permission: 'canManageCustomers',
  },
  {
    id: 'concierto-mapa',
    label: 'Plano del salón',
    icon: LayoutGrid,
    href: '/concierto/mapa',
    permission: 'canManageCustomers',
  },
  {
    id: 'concierto-ordenes',
    label: 'Órdenes entradas',
    icon: QrCode,
    href: '/concierto/ordenes',
    permission: 'canManageCustomers',
  },
  {
    id: 'concierto-escaner',
    label: 'Escáner acceso',
    icon: ScanLine,
    href: '/concierto/escaner',
    permission: 'canManageCustomers',
  },
];

export function resolveConcertNavId(pathname: string): string | null {
  if (pathname.startsWith('/concierto/escaner')) return 'concierto-escaner';
  if (pathname.startsWith('/concierto/mapa')) return 'concierto-mapa';
  if (pathname.startsWith('/concierto/ordenes')) return 'concierto-ordenes';
  if (pathname.startsWith('/concierto')) return 'concierto';
  return null;
}

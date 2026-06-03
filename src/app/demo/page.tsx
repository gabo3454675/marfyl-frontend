'use client';

import Link from 'next/link';
import { Ticket, QrCode, ScanLine, LayoutDashboard, ExternalLink } from 'lucide-react';
import { CONCERT_DEFAULT_SLUG } from '@/lib/concert/feature';
import { CONCERT_MOCK_ENABLED } from '@/lib/concert/mock-data';

const slug = CONCERT_DEFAULT_SLUG;

export default function DemoHubPage() {
  return (
    <div className="concert-root min-h-dvh">
      <div className="concert-shell mx-auto max-w-2xl py-12">
<p className="concert-hero-eyebrow text-center text-blue-400">MARFYL — vista local sin login</p>
        <h1 className="concert-hero-title mt-2 text-center text-3xl font-bold text-white">
          Demo boletería concerto
        </h1>
        <p className="mt-3 text-center text-sm text-slate-400">
          {CONCERT_MOCK_ENABLED
            ? 'Modo demo activo: fallback a mock en errores de red.'
            : 'Modo real: conectado al backend.'}
        </p>
        <p className="mt-2 text-center text-xs text-slate-500">
          {CONCERT_MOCK_ENABLED
            ? 'Para forzar datos reales: quita NEXT_PUBLIC_CONCERT_MOCK=true del .env.local'
            : 'Para activar fallback a mock: agrega NEXT_PUBLIC_CONCERT_MOCK=true al .env.local'}
        </p>
        <p className="mt-2 text-center text-xs text-white/45">
          {CONCERT_MOCK_ENABLED
            ? 'Para forzar datos reales: quita NEXT_PUBLIC_CONCERT_MOCK=true del .env.local'
            : 'Para activar fallback a mock: agrega NEXT_PUBLIC_CONCERT_MOCK=true al .env.local'}
        </p>

        <ul className="mt-10 flex flex-col gap-3">
          <li>
            <Link
              href={`/evento/${slug}`}
              className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-4 transition hover:border-blue-400 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10"
            >
              <Ticket className="h-5 w-5 text-blue-400" />
              <span>
                <strong className="block text-blue-100">Compra pública</strong>
                <span className="text-sm text-slate-400">Mapa de mesas y checkout</span>
              </span>
              <ExternalLink className="ml-auto h-4 w-4 text-blue-400/60" />
            </Link>
          </li>
          <li>
            <Link
              href={`/evento/${slug}/entrada/demo-paid-token`}
              className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-4 transition hover:border-blue-400 hover:bg-blue-500/20"
            >
              <QrCode className="h-5 w-5 text-blue-400" />
              <span>
                <strong className="block text-blue-100">Entrada con QR (pagada)</strong>
                <span className="text-sm text-slate-400">Ejemplo post-confirmación</span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/entradas"
              className="flex items-center gap-3 rounded-xl border border-blue-500/35 bg-blue-500/15 px-4 py-4 transition hover:border-blue-400 hover:bg-blue-500/25"
            >
              <Ticket className="h-5 w-5 text-blue-400" />
              <span>
                <strong className="block text-blue-100">Link corto comprador</strong>
                <span className="text-sm text-slate-400">/entradas → venta pública</span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/concierto/mapa"
              className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-4 transition hover:border-blue-400 hover:bg-blue-500/20"
            >
              <Ticket className="h-5 w-5 text-blue-400" />
              <span>
                <strong className="block text-blue-100">Plano admin (ocupación)</strong>
                <span className="text-sm text-slate-400">Mesas 01–20 en vivo</span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/concierto"
              className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-4 transition hover:border-blue-400 hover:bg-blue-500/20"
            >
              <LayoutDashboard className="h-5 w-5 text-blue-400" />
              <span>
                <strong className="block text-blue-100">Panel dueño — Concierto</strong>
                <span className="text-sm text-slate-400">KPIs y enlace venta</span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/concierto/ordenes"
              className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-4 transition hover:border-blue-400 hover:bg-blue-500/20"
            >
              <Ticket className="h-5 w-5 text-blue-400" />
              <span>
                <strong className="block text-blue-100">Órdenes y confirmar pagos</strong>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/concierto/escaner"
              className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-4 transition hover:border-blue-400 hover:bg-blue-500/20"
            >
              <ScanLine className="h-5 w-5 text-blue-400" />
              <span>
                <strong className="block text-blue-100">Escáner de acceso</strong>
                <span className="text-sm text-slate-400">Prueba: MARFYL-TKT-DEMO-0001</span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl border border-dashed border-blue-500/30 px-4 py-3 text-center text-sm text-slate-400 hover:text-blue-400 hover:border-blue-400/50 transition"
            >
              Dashboard MARFYL completo (vista previa)
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

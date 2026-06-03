'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Settings2, Ticket } from 'lucide-react';
import { concertService } from '@/lib/api';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';
import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { Button } from '@/components/ui/button';
import { isConcertFeatureEnabled } from '@/lib/concert/feature';
import type { ConcertAdminOverview } from '@/lib/concert/types';
import { getApiErrorMessage, isNetworkFailure } from '@/lib/api/get-error-message';
import { CONCERT_MOCK_ENABLED, getMockOverview } from '@/lib/concert/mock-data';

export default function ConciertoAdminPage() {
  const [overview, setOverview] = useState<ConcertAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingUp, setSettingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isConcertFeatureEnabled()) {
      setError('Módulo de concierto desactivado');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await concertService.getOverview();
      setOverview(data);
    } catch (err) {
      if (CONCERT_MOCK_ENABLED && isNetworkFailure(err)) {
        setOverview(getMockOverview());
        setError(null);
      } else {
        setError(getApiErrorMessage(err, 'No se pudo cargar el resumen'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSetup = async () => {
    setSettingUp(true);
    setError(null);
    try {
      await concertService.setupEvent();
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo configurar el evento'));
    } finally {
      setSettingUp(false);
    }
  };

  const publicPath =
    typeof window !== 'undefined' && overview?.event
      ? `${window.location.origin}${overview.event.publicUrl}`
      : overview?.event?.publicUrl ?? '';

  return (
    <AdminPageShell
      eyebrow="Módulo temporal"
      title="Boletería — Concierto"
      subtitle="Venta digital, confirmación de pagos y control de acceso con QR."
      loading={loading}
      actions={
        overview?.configured ? (
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/concierto/ordenes">Ver órdenes</Link>
          </Button>
        ) : undefined
      }
    >
      {error && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {!overview?.configured ? (
        <AdminCard className="max-w-xl">
          <div className="flex flex-col gap-4 p-2 sm:p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Configurar evento</h2>
            <p className="text-sm text-muted-foreground">
              Crea el salón (66 asientos) y VIP (32 asientos) para Inversiones Hemenegilda
              Capacidad. Podrá ajustar precios y fechas después en base de datos o una
              futura pantalla de ajustes.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                className="gap-2"
                disabled={settingUp}
                onClick={handleSetup}
              >
                {settingUp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Settings2 className="h-4 w-4" />
                )}
                Inicializar evento
              </Button>
            </div>
          </div>
        </AdminCard>
      ) : (
        <>
          <div className="admin-stat-grid">
            <AdminStatCard
              title="Disponibles"
              value={String(overview.stats?.available ?? 0)}
            />
            <AdminStatCard
              title="Vendidos"
              value={String(overview.stats?.sold ?? 0)}
            />
            <AdminStatCard
              title="Pendientes pago"
              value={String(overview.stats?.pendingOrders ?? 0)}
            />
            <AdminStatCard
              title="Órdenes pagadas"
              value={String(overview.stats?.paidOrders ?? 0)}
            />
          </div>

          <AdminCard>
            <div className="space-y-3 p-2 sm:p-4">
              <h2 className="font-semibold">{overview.event?.title}</h2>
              <p className="text-sm text-muted-foreground">
                {overview.event?.eventStartsAt &&
                  new Date(overview.event.eventStartsAt).toLocaleString('es-VE')}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="sm" className="gap-2">
                  <a href={publicPath} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Abrir venta pública
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/concierto/mapa">Plano del salón</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/concierto/escaner">Escáner de acceso</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={settingUp}
                  onClick={async () => {
                    setSettingUp(true);
                    try {
                      await concertService.syncCatalog();
                      await load();
                    } catch (err) {
                      setError(getApiErrorMessage(err, 'No se pudo sincronizar precios'));
                    } finally {
                      setSettingUp(false);
                    }
                  }}
                >
                  Sincronizar precios (planilla)
                </Button>
              </div>
            </div>
          </AdminCard>
        </>
      )}
    </AdminPageShell>
  );
}

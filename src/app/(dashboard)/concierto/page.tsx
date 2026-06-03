'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Settings2, Ticket, Copy, Check } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

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

  const handleCopyLink = () => {
    if (!publicPath) return;
    navigator.clipboard.writeText(publicPath).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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

          <AdminCard>
            <div className="space-y-3 p-2 sm:p-4">
              <h2 className="font-semibold">Checklist go-live</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {overview?.configured ? (
                    <span className="text-green-500">✅</span>
                  ) : (
                    <span className="text-amber-500">⚠️</span>
                  )}
                  <span>Evento configurado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">⚠️</span>
                  <span>RESEND_API_KEY configurada (verificar en backend .env)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">📋</span>
                  <span>Link de venta pública:</span>
                  {publicPath ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-primary underline"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          {publicPath}
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-muted-foreground">No disponible</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">🧪</span>
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => alert('Flujo de prueba: aún no implementado')}
                  >
                    Probar flujo completo
                  </button>
                </div>
              </div>
            </div>
          </AdminCard>
        </>
      )}
    </AdminPageShell>
  );
}
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, RefreshCw, Unlock } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';
import { Button } from '@/components/ui/button';
import { ConcertVenueMap } from '@/components/concert/concert-venue-map';
import { isConcertFeatureEnabled, CONCERT_DEFAULT_SLUG } from '@/lib/concert/feature';
import type { ConcertEventPublic } from '@/lib/concert/types';
import { concertService } from '@/lib/api';
import { getApiErrorMessage, isNetworkFailure } from '@/lib/api/get-error-message';
import { CONCERT_MOCK_ENABLED, getMockEvent } from '@/lib/concert/mock-data';
import { ConcertSupportLink } from '@/components/concert/concert-support-link';
import { toast } from 'sonner';

export default function ConciertoMapaPage() {
  const [event, setEvent] = useState<ConcertEventPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMesa, setActiveMesa] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [releasingMesa, setReleasingMesa] = useState(false);

  const load = useCallback(async () => {
    if (!isConcertFeatureEnabled()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await concertService.getEvent(CONCERT_DEFAULT_SLUG);
      setEvent(data);
    } catch (err) {
      if (CONCERT_MOCK_ENABLED && isNetworkFailure(err)) {
        setEvent(getMockEvent());
      } else {
        setError(getApiErrorMessage(err, 'No se pudo cargar el plano'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  const salonSeats = event?.sections.find((s) => s.code === 'SALON')?.seats ?? [];
  const stats = event?.stats;

  const handleReleaseMesa = async () => {
    if (activeMesa == null) return;
    setReleasingMesa(true);
    try {
      const result = await concertService.releaseMesa(activeMesa);
      toast.success(result.message);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo liberar la mesa'));
    } finally {
      setReleasingMesa(false);
    }
  };

  return (
    <AdminPageShell
      eyebrow="Concierto"
      title="Plano del salón — ocupación"
      subtitle="Vista del dueño: mesas 01–20 como en el flyer. Gris = llena; colores = disponibilidad parcial."
      maxWidth="wide"
      loading={loading}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          {activeMesa != null && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={releasingMesa}
              onClick={handleReleaseMesa}
            >
              {releasingMesa ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              Liberar mesa {String(activeMesa).padStart(2, '0')}
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={`/evento/${CONCERT_DEFAULT_SLUG}`} target="_blank">
              <ExternalLink className="h-4 w-4" />
              Ver como comprador
            </Link>
          </Button>
          <ConcertSupportLink variant="button" />
        </div>
      }
    >
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {stats && (
        <div className="admin-stat-grid">
          <AdminCard className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total salón</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </AdminCard>
          <AdminCard className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Disponibles</p>
            <p className="text-2xl font-bold text-emerald-500">{stats.available}</p>
          </AdminCard>
          <AdminCard className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Vendidos</p>
            <p className="text-2xl font-bold">{stats.sold}</p>
          </AdminCard>
          <AdminCard className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Acción</p>
            <Button asChild size="sm" className="mt-1 w-full">
              <Link href="/concierto/ordenes">Órdenes</Link>
            </Button>
          </AdminCard>
        </div>
      )}

      <AdminCard className="overflow-visible p-3 sm:p-4 md:p-5">
        <div className="concert-root rounded-xl bg-[hsl(0_0%_8%)] p-2 sm:p-4 md:p-5">
          <ConcertVenueMap
            seats={salonSeats}
            exchangeRate={event?.exchangeRate ?? 1}
            mode="monitor"
            activeMesa={activeMesa}
            onZoneClick={setActiveMesa}
          />
        </div>
      </AdminCard>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        El comprador usa el mismo plano en{' '}
        <Link href={`/evento/${CONCERT_DEFAULT_SLUG}`} className="text-primary underline">
          /evento/{CONCERT_DEFAULT_SLUG}
        </Link>
        . Usted gestiona pagos en{' '}
        <Link href="/concierto/ordenes" className="text-primary underline">
          Órdenes
        </Link>
        .
      </p>
    </AdminPageShell>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Loader2, MapPin, Mic2, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { concertService } from '@/lib/api';
import { isConcertFeatureEnabled } from '@/lib/concert/feature';
import type { ConcertTicketScanView } from '@/lib/concert/types';
import { getApiErrorMessage, isNetworkFailure } from '@/lib/api/get-error-message';
import { cn } from '@/lib/utils';

function formatShowDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Caracas',
  });
}

function formatShowTime(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('es-VE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Caracas',
  });
}

export default function BoletoPublicoPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const ticketToken = params?.ticketToken as string;

  const [data, setData] = useState<ConcertTicketScanView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug || !ticketToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await concertService.getTicket(slug, ticketToken);
      setData(res);
    } catch (err) {
      if (isNetworkFailure(err)) {
        setError('Sin conexión. Verifique su internet e intente de nuevo.');
      } else {
        setError(getApiErrorMessage(err, 'No se pudo verificar la entrada'));
      }
    } finally {
      setLoading(false);
    }
  }, [slug, ticketToken]);

  useEffect(() => {
    if (!isConcertFeatureEnabled()) {
      setError('Módulo no disponible');
      setLoading(false);
      return;
    }
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="concert-shell flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-300" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="concert-shell mx-auto max-w-md py-16 text-center">
        <p className="text-red-400">{error}</p>
        <Button className="mt-4" variant="outline" onClick={load}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const isOk = data.status === 'confirmed';
  const isUsed = data.status === 'used';
  const artist = data.event?.mainArtist || data.event?.headline;
  const headline =
    data.event?.mainArtist && data.event?.headline && data.event.headline !== data.event.mainArtist
      ? data.event.headline
      : null;
  const showDate = formatShowDate(data.event?.eventStartsAt);
  const showTime = formatShowTime(data.event?.eventStartsAt);

  return (
    <div className="concert-shell mx-auto max-w-lg py-10 px-4">
      <article
        className={cn(
          'overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#12121a] to-[#0a0a0f] shadow-2xl',
          isOk && 'ring-1 ring-teal-400/25',
          isUsed && 'ring-1 ring-amber-500/30',
        )}
      >
        {/* Hero: artista + horario */}
        <header className="border-b border-white/10 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0a0a0f] px-6 py-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">
            MARFYL · Boletería digital
          </p>

          {artist && (
            <h1 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">{artist}</h1>
          )}
          {headline && <p className="mt-2 text-base font-medium text-white/85">{headline}</p>}

          {(data.event?.entryTimeLabel || showDate || showTime) && (
            <div className="mt-4 space-y-1">
              {data.event?.entryTimeLabel && (
                <p className="text-lg font-bold text-teal-300">
                  Ingreso {data.event.entryTimeLabel}
                  {showTime ? ` · Show ${showTime}` : ''}
                </p>
              )}
              {showDate && (
                <p className="flex items-center gap-2 text-sm text-white/70">
                  <CalendarDays className="h-4 w-4 shrink-0 text-teal-300" />
                  {showDate}
                </p>
              )}
            </div>
          )}

          {data.event?.venueName && (
            <p className="mt-3 flex items-start gap-2 text-sm text-white/55">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-300/80" />
              <span>
                {data.event.venueName}
                {data.event.title ? ` · ${data.event.title}` : ''}
              </span>
            </p>
          )}
        </header>

        {/* Estado + mensaje al cliente */}
        <section className="border-b border-white/10 px-6 py-6 text-center">
          <div
            className={cn(
              'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full',
              isOk && 'bg-teal-400/15 text-teal-300',
              isUsed && 'bg-amber-500/15 text-amber-400',
              !isOk && !isUsed && 'bg-white/10 text-white/50',
            )}
          >
            <Ticket className="h-6 w-6" />
          </div>
          <p className="text-lg font-semibold text-white">{data.title}</p>
          {data.greeting && <p className="mt-2 text-base font-medium text-white/90">{data.greeting}</p>}
          <p className="mt-2 text-sm leading-relaxed text-white/65">{data.message}</p>
        </section>

        {/* Silla + código */}
        {(data.seatLabel || data.ticketCode) && (
          <section className="space-y-4 px-6 py-6">
            {data.seatLabel && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-white/45">Tu silla</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {data.sectionCode} · {data.seatLabel}
                </p>
              </div>
            )}
            {data.ticketCode && (
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-wider text-white/45">Código de entrada</p>
                <p className="mt-1 font-mono text-xl font-bold tracking-wider text-teal-300">
                  {data.ticketCode}
                </p>
              </div>
            )}
          </section>
        )}

        {data.event?.lineup && (
          <section className="border-t border-white/10 px-6 py-4">
            <p className="flex items-start gap-2 text-sm text-white/70">
              <Mic2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-300/80" />
              {data.event.lineup}
            </p>
          </section>
        )}

        <footer className="border-t border-white/10 px-6 py-5 text-center">
          {isOk && (
            <p className="text-xs text-white/50">
              Guarda tu correo con el QR. Preséntalo en la puerta el día del evento.
            </p>
          )}
          <p className="mt-4">
            <Link
              href={`/evento/${slug}`}
              className="text-sm text-teal-300 underline underline-offset-2"
            >
              Ver información del evento
            </Link>
          </p>
        </footer>
      </article>
    </div>
  );
}

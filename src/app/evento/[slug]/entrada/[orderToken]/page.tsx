'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConcertTicketCard } from '@/components/concert/concert-ticket-card';
import { isConcertFeatureEnabled } from '@/lib/concert/feature';
import type { ConcertOrderPublicView } from '@/lib/concert/types';
import { concertService } from '@/lib/api';
import { getApiErrorMessage, isNetworkFailure } from '@/lib/api/get-error-message';
import { CONCERT_MOCK_ENABLED, getMockOrder } from '@/lib/concert/mock-data';

import { CONCERT_TICKET_DISPLAY } from '@/lib/concert/ticket-display.constants';

export default function ConcertTicketPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const orderToken = params?.orderToken as string;

  const [order, setOrder] = useState<ConcertOrderPublicView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const load = useCallback(async () => {
    if (!slug || !orderToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await concertService.getOrder(slug, orderToken);
      setOrder(data);
    } catch (err) {
      if (CONCERT_MOCK_ENABLED && isNetworkFailure(err)) {
        setOrder(getMockOrder(orderToken));
        setError(null);
      } else {
        setError(getApiErrorMessage(err, 'No se pudo cargar la orden'));
      }
    } finally {
      setLoading(false);
    }
  }, [slug, orderToken]);

  useEffect(() => {
    if (!isConcertFeatureEnabled()) {
      setError('Módulo no disponible');
      setLoading(false);
      return;
    }
    load();
  }, [load]);

  useEffect(() => {
    if (order?.paid) return;
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load, order?.paid]);

  const handleResendEmail = async () => {
    if (!order) return;
    setResending(true);
    setError(null);
    try {
      await concertService.resendEmail(order.id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo reenviar el email'));
    } finally {
      setResending(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="concert-shell flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-teal-300" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="concert-shell text-center">
        <p className="text-red-400">{error}</p>
        <Button className="mt-4" variant="outline" onClick={load}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!order) return null;

  if (!order.paid) {
    return (
      <div className="concert-shell mx-auto max-w-md text-center">
        <h1 className="text-2xl font-bold">Pago en revisión</h1>
        <p className="mt-3 text-white/70">{order.message}</p>
        <p className="mt-2 text-sm text-white/50">
          Hola {order.buyerName}. Cuando el organizador confirme su pago, sus entradas
          aparecerán aquí automáticamente.
        </p>
        {order.amountUsd != null && (
          <p className="mt-4 text-lg font-medium">
            Total: USD {order.amountUsd.toFixed(2)}
            {order.amountBs != null && (
              <> · Bs {order.amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</>
            )}
          </p>
        )}
        <Button className="mt-6 gap-2" variant="outline" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          Actualizar estado
        </Button>
        <p className="mt-6">
          <Link href={`/evento/${slug}`} className="text-sm text-[hsl(var(--dm-a-accent))] underline">
            Volver al evento
          </Link>
        </p>
      </div>
    );
  }

return (
    <div className="concert-shell space-y-8">
      {order.emailSentAt ? (
        <div className="mx-auto max-w-md rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
          <Mail className="mx-auto mb-2 h-6 w-6 text-green-400" />
          <p className="font-medium text-green-300">Revisa tu correo — te enviamos tus entradas</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 gap-2 border-white/20"
            disabled={resending}
            onClick={handleResendEmail}
          >
            {resending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Reenviar a mi correo
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="mx-auto max-w-md rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
          <p className="text-sm text-amber-200/80">
            Tus entradas aún no han sido enviadas. El organizador confirmará tu pago pronto.
          </p>
        </div>
      )}

      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">
          MARFYL · Entradas digitales
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white">{CONCERT_TICKET_DISPLAY.mainArtist}</h1>
        <p className="mt-1 text-base text-white/80">
          {order.event?.subtitle ?? CONCERT_TICKET_DISPLAY.eventHeadline}
        </p>
        <p className="mt-2 text-base font-bold text-teal-300">
          Ingreso {CONCERT_TICKET_DISPLAY.entryTimeLabel}
        </p>
        <p className="mt-3 text-sm text-white/50">
          Presente el código QR en el acceso. Guarde o capture esta pantalla.
        </p>
      </header>
      <div className="mx-auto flex max-w-md flex-col gap-6">
        {order.tickets?.map((ticket) => (
          <ConcertTicketCard
            key={ticket.publicToken}
            ticket={ticket}
            eventTitle={order.event!.title}
            eventSubtitle={order.event!.subtitle}
            venueName={order.event!.venueName}
            eventStartsAt={order.event!.eventStartsAt}
            buyerName={order.buyerName!}
          />
        ))}
      </div>
    </div>
  );
}

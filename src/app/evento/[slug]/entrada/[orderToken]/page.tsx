'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConcertTicketCard } from '@/components/concert/concert-ticket-card';
import { isConcertFeatureEnabled } from '@/lib/concert/feature';
import type { ConcertOrderPublicView } from '@/lib/concert/types';
import { concertService } from '@/lib/api';
import { getApiErrorMessage, isNetworkFailure } from '@/lib/api/get-error-message';
import { CONCERT_MOCK_ENABLED, getMockOrder } from '@/lib/concert/mock-data';

export default function ConcertTicketPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const orderToken = params?.orderToken as string;

  const [order, setOrder] = useState<ConcertOrderPublicView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading && !order) {
    return (
      <div className="concert-shell flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-[hsl(var(--dm-a-accent))]" />
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
      <header className="text-center">
        <h1 className="text-2xl font-bold">Sus entradas</h1>
        <p className="mt-2 text-sm text-white/60">
          Presente el código QR en el acceso. Guarde o capture esta pantalla.
        </p>
      </header>
      <div className="mx-auto flex max-w-md flex-col gap-6">
        {order.tickets?.map((ticket) => (
          <ConcertTicketCard
            key={ticket.publicToken}
            ticket={ticket}
            eventTitle={order.event!.title}
            venueName={order.event!.venueName}
            eventStartsAt={order.event!.eventStartsAt}
            buyerName={order.buyerName!}
          />
        ))}
      </div>
    </div>
  );
}

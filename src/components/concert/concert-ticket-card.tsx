'use client';

import { QRCodeSVG } from 'qrcode.react';
import type { ConcertTicketPublic } from '@/lib/concert/types';

type Props = {
  ticket: ConcertTicketPublic;
  eventTitle: string;
  venueName?: string | null;
  eventStartsAt: string;
  buyerName: string;
};

export function ConcertTicketCard({
  ticket,
  eventTitle,
  venueName,
  eventStartsAt,
  buyerName,
}: Props) {
  const date = new Date(eventStartsAt);

  return (
    <article className="concert-ticket-card">
      <header className="concert-ticket-card-header">
        <p className="concert-ticket-eyebrow">Entrada digital</p>
        <h2 className="concert-ticket-title">{eventTitle}</h2>
        {venueName && <p className="concert-ticket-venue">{venueName}</p>}
        <p className="concert-ticket-date">
          {date.toLocaleDateString('es-VE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </header>
      <div className="concert-ticket-qr-wrap">
        <QRCodeSVG
          value={ticket.qrPayload}
          size={200}
          level="M"
          includeMargin
          className="concert-ticket-qr"
        />
      </div>
      <dl className="concert-ticket-meta">
        <div>
          <dt>Asistente</dt>
          <dd>{buyerName}</dd>
        </div>
        <div>
          <dt>Asiento</dt>
          <dd>
            {ticket.sectionCode} · {ticket.seatLabel}
          </dd>
        </div>
        <div>
          <dt>Código</dt>
          <dd className="concert-ticket-code">{ticket.qrPayload}</dd>
        </div>
      </dl>
      {ticket.checkedIn && (
        <p className="concert-ticket-used">Esta entrada ya fue utilizada</p>
      )}
    </article>
  );
}

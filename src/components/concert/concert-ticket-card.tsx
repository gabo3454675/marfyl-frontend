'use client';

import { QRCodeSVG } from 'qrcode.react';
import type { ConcertTicketPublic } from '@/lib/concert/types';
import { CONCERT_TICKET_DISPLAY } from '@/lib/concert/ticket-display.constants';

type Props = {
  ticket: ConcertTicketPublic;
  eventTitle: string;
  eventSubtitle?: string | null;
  venueName?: string | null;
  eventStartsAt: string;
  buyerName: string;
};

export function ConcertTicketCard({
  ticket,
  eventTitle,
  eventSubtitle,
  venueName,
  eventStartsAt,
  buyerName,
}: Props) {
  const date = new Date(eventStartsAt);
  const artist = CONCERT_TICKET_DISPLAY.mainArtist;
  const headline = eventSubtitle ?? CONCERT_TICKET_DISPLAY.eventHeadline;

  return (
    <article className="concert-ticket-card">
      <header className="concert-ticket-card-header">
        <p className="concert-ticket-eyebrow">Entrada digital · MARFYL</p>
        <h2 className="concert-ticket-title">{artist}</h2>
        <p className="concert-ticket-subtitle">{headline}</p>
        <p className="concert-ticket-schedule">
          Ingreso {CONCERT_TICKET_DISPLAY.entryTimeLabel}
          {' · '}
          {date.toLocaleDateString('es-VE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Caracas',
          })}
        </p>
        {venueName && (
          <p className="concert-ticket-venue">
            {venueName} · {eventTitle || CONCERT_TICKET_DISPLAY.venueLabel}
          </p>
        )}
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
          <dd className="concert-ticket-code">
            {ticket.ticketCode ?? ticket.publicToken.slice(0, 8).toUpperCase()}
          </dd>
        </div>
      </dl>
      {ticket.checkedIn && (
        <p className="concert-ticket-used">Esta entrada ya fue utilizada</p>
      )}
    </article>
  );
}

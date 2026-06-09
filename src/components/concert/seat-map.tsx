'use client';

import { cn } from '@/lib/utils';
import type { ConcertMesaPublic, ConcertSeatPublic } from '@/lib/concert/types';

type Props = {
  sectionLabel: string;
  mesas: ConcertMesaPublic[];
  selectedIds: Set<number>;
  onToggle: (seat: ConcertSeatPublic) => void;
  disabled?: boolean;
};

function SeatButton({
  seat,
  selected,
  onToggle,
  disabled,
}: {
  seat: ConcertSeatPublic;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const available = seat.status === 'AVAILABLE';
  const held = seat.status === 'HELD';
  const sold = seat.status === 'SOLD';

  return (
    <button
      type="button"
      disabled={disabled || sold || held}
      onClick={onToggle}
      title={
        seat.priceUsd != null
          ? `Asiento ${seat.displayNumber ?? seat.seatNumber} — USD ${seat.priceUsd} / Bs ${seat.priceBs}`
          : undefined
      }
      aria-label={`Asiento ${seat.displayNumber ?? seat.seatNumber}`}
      aria-pressed={selected}
      className={cn(
        'concert-seat',
        sold && 'concert-seat--sold',
        held && 'concert-seat--held',
        available && !selected && 'concert-seat--available',
        selected && 'concert-seat--selected',
      )}
    >
      <span className="concert-seat-num">{seat.displayNumber ?? seat.seatNumber}</span>
    </button>
  );
}

export function SeatMap({ sectionLabel, mesas, selectedIds, onToggle, disabled }: Props) {
  return (
    <div className="concert-section-map">
      <div className="concert-section-map-header">
        <h3 className="concert-section-title">{sectionLabel}</h3>
      </div>
      <div className="concert-stage" aria-hidden>
        Escenario
      </div>
      <div className="flex flex-col gap-6">
        {mesas.map((mesa) => (
          <div key={`${mesa.mesaNumber}-${mesa.tierCode}`} className="concert-mesa-block">
            <div className="concert-mesa-header">
              <span className="font-medium">Mesa {mesa.mesaNumber}</span>
              {mesa.tierLabel && (
                <span className="text-xs text-white/50">{mesa.tierLabel}</span>
              )}
              {mesa.priceUsd != null && (
                <span className="ml-auto text-xs text-[hsl(var(--dm-a-accent))]">
                  USD {mesa.priceUsd} efectivo
                  {mesa.priceUsdBolivares != null && (
                    <> · USD {mesa.priceUsdBolivares} al cambio</>
                  )}
                  {mesa.priceBs != null && (
                    <> (Bs {mesa.priceBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })})</>
                  )}
                </span>
              )}
            </div>
            <div className="concert-row-seats mt-2">
              {mesa.seats.map((seat) => (
                <SeatButton
                  key={seat.id}
                  seat={seat}
                  selected={selectedIds.has(seat.id)}
                  disabled={disabled}
                  onToggle={() => onToggle(seat)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

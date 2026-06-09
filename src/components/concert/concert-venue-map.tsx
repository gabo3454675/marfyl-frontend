'use client';

import { cn } from '@/lib/utils';
import { SALON_ZONE_DEFS, TIER_SHORT, type SalonZoneTier } from '@/lib/concert/venue-layout';
import {
  buildMesaOccupancy,
  zoneStatusLabel,
} from '@/lib/concert/venue-stats';
import type { ConcertSeatPublic } from '@/lib/concert/types';
import { formatBsAmount, usdToBsForConcert } from '@/lib/concert/pricing';

type Props = {
  seats: ConcertSeatPublic[];
  /** Tasa BCV para calcular Bs = USD al cambio × tasa */
  exchangeRate?: number;
  mode: 'buy' | 'monitor';
  selectedIds?: Set<number>;
  activeMesa?: number | null;
  onZoneClick?: (mesaNumber: number) => void;
  onSeatToggle?: (seat: ConcertSeatPublic) => void;
  className?: string;
};

function tierClass(tier: SalonZoneTier): string {
  switch (tier) {
    case 'VIP':
      return 'venue-zone--vip';
    case 'PREFERENCIAL':
      return 'venue-zone--preferencial';
    case 'MEDIA':
      return 'venue-zone--media';
    case 'GENERAL':
      return 'venue-zone--general';
  }
}

function ZoneBlock({
  def,
  seats,
  mode,
  isActive,
  onClick,
  exchangeRate,
}: {
  def: (typeof SALON_ZONE_DEFS)[0];
  seats: ConcertSeatPublic[];
  mode: 'buy' | 'monitor';
  isActive: boolean;
  onClick: () => void;
  exchangeRate: number;
}) {
  const occupancy = buildMesaOccupancy(seats, def.mesaNumber);
  const soldOut = occupancy.total > 0 && occupancy.available === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={mode === 'buy' && soldOut}
      className={cn(
        'venue-zone',
        tierClass(def.tier),
        isActive && 'venue-zone--active',
        soldOut && 'venue-zone--sold-out',
        mode === 'buy' && !soldOut && 'hover:brightness-110 cursor-pointer',
      )}
      aria-label={`Mesa ${def.zoneLabel}, ${def.mapLabel}, USD ${def.priceUsd}`}
    >
      <span className="venue-zone-tier">{TIER_SHORT[def.tier]}</span>
      <span className="venue-zone-num">Mesa {def.zoneLabel}</span>
      <span className="venue-zone-price">
        ${def.priceUsd} efectivo · ${def.priceBs} al cambio
      </span>
      <span className="venue-zone-meta">
        {soldOut ? (
          <span className="venue-zone-badge venue-zone-badge--full">LLENA</span>
        ) : occupancy.available === occupancy.total ? (
          <span className="venue-zone-badge venue-zone-badge--ok">Disponible</span>
        ) : (
          <span className="venue-zone-badge venue-zone-badge--partial">
            {occupancy.available} libre{occupancy.available !== 1 ? 's' : ''}
          </span>
        )}
      </span>
      <span className="venue-zone-seats">
        {occupancy.sold} vendido{occupancy.sold !== 1 ? 's' : ''} · {occupancy.total} asientos
      </span>
    </button>
  );
}

function SeatChip({
  seat,
  selected,
  onToggle,
  readOnly,
}: {
  seat: ConcertSeatPublic;
  selected: boolean;
  onToggle: () => void;
  readOnly: boolean;
}) {
  const sold = seat.status === 'SOLD';
  const held = seat.status === 'HELD';
  const available = seat.status === 'AVAILABLE';

  return (
    <button
      type="button"
      disabled={readOnly || sold || held}
      onClick={onToggle}
      className={cn(
        'concert-seat text-[10px] sm:text-xs',
        sold && 'concert-seat--sold',
        held && 'concert-seat--held',
        available && !selected && 'concert-seat--available',
        selected && 'concert-seat--selected',
      )}
    >
      {seat.displayNumber ?? seat.seatNumber}
    </button>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return <p className="venue-row-label">{children}</p>;
}

export function ConcertVenueMap({
  seats,
  exchangeRate = 1,
  mode,
  selectedIds = new Set(),
  activeMesa = null,
  onZoneClick,
  onSeatToggle,
  className,
}: Props) {
  const activeDef = activeMesa != null ? SALON_ZONE_DEFS.find((z) => z.mesaNumber === activeMesa) : null;
  const activeSeats = activeMesa
    ? seats.filter((s) => s.mesaNumber === activeMesa).sort((a, b) => (a.displayNumber ?? 0) - (b.displayNumber ?? 0))
    : [];

  const renderZone = (mesa: number) => {
    const def = SALON_ZONE_DEFS.find((z) => z.mesaNumber === mesa)!;
    return (
      <ZoneBlock
        key={mesa}
        def={def}
        seats={seats}
        mode={mode}
        isActive={activeMesa === mesa}
        exchangeRate={exchangeRate}
        onClick={() => onZoneClick?.(mesa)}
      />
    );
  };

  return (
    <div className={cn('venue-map-wrap', className)}>
      <div className="venue-legend venue-legend--rich">
        <div className="venue-legend-item venue-zone--vip venue-legend-swatch">
          <strong>Silla VIP</strong>
          <span>
            Mesas 03, 04, 07, 08 · $60 efectivo · $70 al cambio (Bs{' '}
            {formatBsAmount(usdToBsForConcert(70, exchangeRate))})
          </span>
        </div>
        <div className="venue-legend-item venue-zone--preferencial venue-legend-swatch">
          <strong>Silla preferencial</strong>
          <span>
            Mesas 01, 02, 05, 06 · $50 efectivo · $60 al cambio (Bs{' '}
            {formatBsAmount(usdToBsForConcert(60, exchangeRate))})
          </span>
        </div>
        <div className="venue-legend-item venue-zone--media venue-legend-swatch">
          <strong>Silla media</strong>
          <span>
            Mesas 09–14 · $45 efectivo · $55 al cambio (Bs{' '}
            {formatBsAmount(usdToBsForConcert(55, exchangeRate))})
          </span>
        </div>
        <div className="venue-legend-item venue-zone--general venue-legend-swatch">
          <strong>Silla general</strong>
          <span>
            Mesas 15–20 · $40 efectivo · $50 al cambio (Bs{' '}
            {formatBsAmount(usdToBsForConcert(50, exchangeRate))})
          </span>
        </div>
      </div>

      <p className="venue-map-hint">
        {mode === 'buy'
          ? 'Efectivo: precio USD del flyer. Bolívares: el otro monto USD del flyer × tasa BCV.'
          : 'Vista del organizador: ocupación por mesa en tiempo real.'}
      </p>

      <div className="venue-map">
        <div className="venue-stage">TARIMA — escenario</div>

        <RowLabel>VIP 03·04·07·08 (azul) y preferencial 01·02·05·06 (verde)</RowLabel>
        <div className="venue-row venue-row--top">
          {renderZone(1)}
          {renderZone(2)}
          <div className="venue-gap" aria-hidden />
          {renderZone(3)}
          {renderZone(4)}
          <div className="venue-gap" aria-hidden />
          {renderZone(5)}
          {renderZone(6)}
        </div>

        <div className="venue-row venue-row--vip">
          {renderZone(7)}
          {renderZone(8)}
        </div>

        <RowLabel>Silla media — mesas 09 a 14</RowLabel>
        <div className="venue-row venue-row--media">
          {[9, 10, 11, 12, 13, 14].map(renderZone)}
        </div>

        <RowLabel>Silla general — mesas 15 a 20</RowLabel>
        <div className="venue-row venue-row--general">
          {[15, 16, 17, 18].map(renderZone)}
        </div>

        <div className="venue-row venue-row--back">
          {renderZone(19)}
          <div className="venue-service">Servicio</div>
          {renderZone(20)}
        </div>
      </div>

      {activeDef && activeSeats.length > 0 && (
        <div className="venue-mesa-panel" id="mesa-panel">
          <div className={cn('venue-mesa-panel-header', tierClass(activeDef.tier))}>
            <p className="venue-mesa-panel-tier">{TIER_SHORT[activeDef.tier]} · {activeDef.tierLabel}</p>
            <h3>Mesa {activeDef.zoneLabel}</h3>
            <p className="text-sm opacity-90">
              Efectivo USD {activeDef.priceUsd} · Pago Bs: USD {activeDef.priceBs} al cambio (Bs{' '}
              {formatBsAmount(usdToBsForConcert(activeDef.priceBs, exchangeRate))})
              {' · '}
              {zoneStatusLabel(buildMesaOccupancy(seats, activeMesa!))}
            </p>
          </div>
          <p className="mb-2 mt-3 text-xs text-white/55">
            Asientos de esta mesa (número en planilla):
          </p>
          <div className="concert-row-seats flex-wrap gap-2">
            {activeSeats.map((seat) => (
              <SeatChip
                key={seat.id}
                seat={seat}
                selected={selectedIds.has(seat.id)}
                readOnly={mode === 'monitor'}
                onToggle={() => onSeatToggle?.(seat)}
              />
            ))}
          </div>
          {mode === 'buy' && (
            <p className="mt-3 text-xs text-white/50">
              Verde = libre · Gris = vendido · Amarillo = en reserva · Toque para seleccionar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

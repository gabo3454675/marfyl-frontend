'use client';

import { cn } from '@/lib/utils';
import { SALON_ZONE_DEFS, SALON_GRID_POSITIONS, SALON_NON_MESA_ITEMS, TIER_SHORT, type SalonZoneTier } from '@/lib/concert/venue-layout';
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
  const heldOnly =
    soldOut && occupancy.held > 0 && occupancy.sold === 0;

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
        {heldOnly ? (
          <span className="venue-zone-badge venue-zone-badge--partial">EN RESERVA</span>
        ) : soldOut ? (
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

      <div className="venue-map-scroll">
      <div className="venue-map">
        {/* Elementos decorativos del grid */}
        {SALON_NON_MESA_ITEMS.map((item) => (
          <div
            key={item.id}
            className={item.className}
            style={{
              gridRow: item.gridRow,
              gridColumn: `${item.gridCol} / span ${item.colSpan}`,
            }}
          >
            {item.label}
          </div>
        ))}

        {/* Mesas */}
        {SALON_ZONE_DEFS.map((def) => {
          const pos = SALON_GRID_POSITIONS[def.mesaNumber];
          if (!pos) return null;
          return (
            <div
              key={def.mesaNumber}
              style={{
                gridRow: pos.gridRow,
                gridColumn: `${pos.gridCol} / span ${pos.colSpan}`,
              }}
            >
              <ZoneBlock
                def={def}
                seats={seats}
                mode={mode}
                isActive={activeMesa === def.mesaNumber}
                exchangeRate={exchangeRate}
                onClick={() => onZoneClick?.(def.mesaNumber)}
              />
            </div>
          );
        })}
      </div>
      </div>

      {/* BAÑOS — posición exterior derecha */}
      <p className="mt-1 text-right text-[10px] uppercase tracking-wider text-slate-500 sm:text-xs">
        BAÑOS →
      </p>

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

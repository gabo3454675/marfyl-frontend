import type { ConcertSeatPublic } from '@/lib/concert/types';

export type MesaOccupancy = {
  mesaNumber: number;
  total: number;
  available: number;
  held: number;
  sold: number;
};

export function buildMesaOccupancy(
  seats: ConcertSeatPublic[],
  mesaNumber: number,
): MesaOccupancy {
  const mesaSeats = seats.filter((s) => s.mesaNumber === mesaNumber);
  return {
    mesaNumber,
    total: mesaSeats.length,
    available: mesaSeats.filter((s) => s.status === 'AVAILABLE').length,
    held: mesaSeats.filter((s) => s.status === 'HELD').length,
    sold: mesaSeats.filter((s) => s.status === 'SOLD').length,
  };
}

export function zoneFillRatio(o: MesaOccupancy): number {
  if (o.total === 0) return 0;
  return (o.sold + o.held) / o.total;
}

export function zoneStatusLabel(o: MesaOccupancy): string {
  if (o.total === 0) return '—';
  if (o.available === 0 && o.held > 0 && o.sold === 0) return 'En reserva';
  if (o.available === 0) return 'Llena';
  if (o.sold > 0 || o.held > 0) return `${o.available} libre`;
  return 'Disponible';
}

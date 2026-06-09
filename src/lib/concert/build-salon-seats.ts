import type { ConcertMesaPublic, ConcertSeatPublic } from '@/lib/concert/types';
import { concertBsPaymentAmount } from '@/lib/concert/pricing';
import { SALON_MESA_SEATS, SALON_ZONE_DEFS, getZoneDef } from '@/lib/concert/venue-layout';
/** Genera mesas + asientos del salón (demo o tests). */
export function buildSalonMesasFromLayout(
  statusForSeat?: (displayNumber: number, mesa: number) => ConcertSeatPublic['status'],
): { mesas: ConcertMesaPublic[]; seats: ConcertSeatPublic[] } {
  let id = 1;
  const mesas: ConcertMesaPublic[] = [];

  for (const def of SALON_ZONE_DEFS) {
    const seatNums = SALON_MESA_SEATS[def.mesaNumber] ?? [];
    const seats: ConcertSeatPublic[] = seatNums.map((displayNumber, idx) => {
      const status =
        statusForSeat?.(displayNumber, def.mesaNumber) ??
        (displayNumber === 9 || displayNumber === 18 || displayNumber === 27
          ? 'SOLD'
          : displayNumber === 13
            ? 'HELD'
            : 'AVAILABLE');
      return {
        id: id++,
        rowLabel: `M${def.mesaNumber}`,
        seatNumber: idx + 1,
        mesaNumber: def.mesaNumber,
        displayNumber,
        priceUsd: def.priceUsd,
        priceUsdBolivares: def.priceBs,
        priceBs: concertBsPaymentAmount(def.priceBs, 40.5),
        tierCode: def.tier,
        tierLabel: def.tierLabel,
        status,
      };
    });
    mesas.push({
      mesaNumber: def.mesaNumber,
      tierCode: def.tier,
      tierLabel: def.tierLabel,
      priceUsd: def.priceUsd,
      priceUsdBolivares: def.priceBs,
      priceBs: concertBsPaymentAmount(def.priceBs, 40.5),
      seats,
    });
  }

  return { mesas, seats: mesas.flatMap((m) => m.seats) };
}

export function getZoneDefOrThrow(mesa: number) {
  const z = getZoneDef(mesa);
  if (!z) throw new Error(`Mesa ${mesa} no definida`);
  return z;
}

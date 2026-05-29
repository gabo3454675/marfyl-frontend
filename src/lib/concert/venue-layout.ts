/**
 * Plano del salón — mesas 01–20 (flyer Monddy).
 *
 * Zonas confirmadas por el cliente:
 * - VIP (azul):        03, 04, 07, 08
 * - Preferencial (verde): 01, 02, 05, 06
 * - Media (naranja): 09, 10, 11, 12, 13, 14
 * - General (teal):   15, 16, 17, 18, 19, 20
 *
 * Salón VIP aparte (32 sillas): sección VIP en otro espacio físico.
 */

export type SalonZoneTier = 'VIP' | 'PREFERENCIAL' | 'MEDIA' | 'GENERAL';

export type SalonZoneDef = {
  mesaNumber: number;
  zoneLabel: string;
  tier: SalonZoneTier;
  tierLabel: string;
  mapLabel: string;
  priceUsd: number;
  priceBs: number;
};

export const SALON_ZONE_DEFS: SalonZoneDef[] = [
  { mesaNumber: 1, zoneLabel: '01', tier: 'PREFERENCIAL', tierLabel: 'Silla preferencial', mapLabel: 'Preferencial', priceUsd: 50, priceBs: 60 },
  { mesaNumber: 2, zoneLabel: '02', tier: 'PREFERENCIAL', tierLabel: 'Silla preferencial', mapLabel: 'Preferencial', priceUsd: 50, priceBs: 60 },
  { mesaNumber: 3, zoneLabel: '03', tier: 'VIP', tierLabel: 'Silla VIP', mapLabel: 'VIP', priceUsd: 60, priceBs: 70 },
  { mesaNumber: 4, zoneLabel: '04', tier: 'VIP', tierLabel: 'Silla VIP', mapLabel: 'VIP', priceUsd: 60, priceBs: 70 },
  { mesaNumber: 5, zoneLabel: '05', tier: 'PREFERENCIAL', tierLabel: 'Silla preferencial', mapLabel: 'Preferencial', priceUsd: 50, priceBs: 60 },
  { mesaNumber: 6, zoneLabel: '06', tier: 'PREFERENCIAL', tierLabel: 'Silla preferencial', mapLabel: 'Preferencial', priceUsd: 50, priceBs: 60 },
  { mesaNumber: 7, zoneLabel: '07', tier: 'VIP', tierLabel: 'Silla VIP', mapLabel: 'VIP', priceUsd: 60, priceBs: 70 },
  { mesaNumber: 8, zoneLabel: '08', tier: 'VIP', tierLabel: 'Silla VIP', mapLabel: 'VIP', priceUsd: 60, priceBs: 70 },
  { mesaNumber: 9, zoneLabel: '09', tier: 'MEDIA', tierLabel: 'Silla media', mapLabel: 'Media', priceUsd: 45, priceBs: 55 },
  { mesaNumber: 10, zoneLabel: '10', tier: 'MEDIA', tierLabel: 'Silla media', mapLabel: 'Media', priceUsd: 45, priceBs: 55 },
  { mesaNumber: 11, zoneLabel: '11', tier: 'MEDIA', tierLabel: 'Silla media', mapLabel: 'Media', priceUsd: 45, priceBs: 55 },
  { mesaNumber: 12, zoneLabel: '12', tier: 'MEDIA', tierLabel: 'Silla media', mapLabel: 'Media', priceUsd: 45, priceBs: 55 },
  { mesaNumber: 13, zoneLabel: '13', tier: 'MEDIA', tierLabel: 'Silla media', mapLabel: 'Media', priceUsd: 45, priceBs: 55 },
  { mesaNumber: 14, zoneLabel: '14', tier: 'MEDIA', tierLabel: 'Silla media', mapLabel: 'Media', priceUsd: 45, priceBs: 55 },
  { mesaNumber: 15, zoneLabel: '15', tier: 'GENERAL', tierLabel: 'Silla general', mapLabel: 'General', priceUsd: 40, priceBs: 50 },
  { mesaNumber: 16, zoneLabel: '16', tier: 'GENERAL', tierLabel: 'Silla general', mapLabel: 'General', priceUsd: 40, priceBs: 50 },
  { mesaNumber: 17, zoneLabel: '17', tier: 'GENERAL', tierLabel: 'Silla general', mapLabel: 'General', priceUsd: 40, priceBs: 50 },
  { mesaNumber: 18, zoneLabel: '18', tier: 'GENERAL', tierLabel: 'Silla general', mapLabel: 'General', priceUsd: 40, priceBs: 50 },
  { mesaNumber: 19, zoneLabel: '19', tier: 'GENERAL', tierLabel: 'Silla general', mapLabel: 'General', priceUsd: 40, priceBs: 50 },
  { mesaNumber: 20, zoneLabel: '20', tier: 'GENERAL', tierLabel: 'Silla general', mapLabel: 'General', priceUsd: 40, priceBs: 50 },
];

/** Mesas por zona (referencia rápida) */
export const ZONE_MESAS: Record<SalonZoneTier, number[]> = {
  VIP: [3, 4, 7, 8],
  PREFERENCIAL: [1, 2, 5, 6],
  MEDIA: [9, 10, 11, 12, 13, 14],
  GENERAL: [15, 16, 17, 18, 19, 20],
};

/** Capacidad por mesa (flyer Monddy — total 66) */
export const SALON_MESA_SEAT_COUNTS: Record<number, number> = {
  1: 4, 2: 2, 3: 4, 4: 3, 5: 4, 6: 4, 7: 4, 8: 4,
  9: 2, 10: 2, 11: 4, 12: 4, 13: 2, 14: 4,
  15: 4, 16: 2, 17: 2, 18: 3, 19: 4, 20: 4,
};

/** Asientos globales (planilla 1–66) por mesa — sincronizado con backend/hemenegilda-seat-catalog */
export const SALON_MESA_SEATS: Record<number, number[]> = {
  3: [1, 2, 3, 4],
  4: [5, 6, 7],
  7: [8, 9, 10, 11],
  8: [12, 13, 14, 15],
  1: [16, 17, 18, 19],
  2: [20, 21],
  5: [22, 23, 24, 25],
  6: [26, 27, 28, 29],
  9: [30, 31],
  10: [32, 33],
  11: [34, 35, 36, 37],
  12: [38, 39, 40, 41],
  13: [42, 43],
  14: [44, 45, 46, 47],
  15: [48, 49, 50, 51],
  16: [52, 53],
  17: [54, 55],
  18: [56, 57, 58],
  19: [59, 60, 61, 62],
  20: [63, 64, 65, 66],
};

export const TIER_SHORT: Record<SalonZoneTier, string> = {
  VIP: 'VIP',
  PREFERENCIAL: 'Pref.',
  MEDIA: 'Media',
  GENERAL: 'General',
};

export function getZoneDef(mesaNumber: number) {
  return SALON_ZONE_DEFS.find((z) => z.mesaNumber === mesaNumber);
}

export function tierForMesa(mesaNumber: number): SalonZoneTier | undefined {
  return getZoneDef(mesaNumber)?.tier;
}

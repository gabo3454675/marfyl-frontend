/** Misma regla que backend liquor-sales.util (cerveza). */
export const BOTTLES_PER_TOBO = 12;
export const TOBOS_PER_CASE = 3;
export const BOTTLES_PER_CASE = BOTTLES_PER_TOBO * TOBOS_PER_CASE;

function norm(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isExcluded(n: string) {
  if (/\bMALTIN\b|\bMALTA\b/.test(n)) return true;
  if (/\bPEPSI\b|\bCOCA\b|\b7UP\b|\bREFRESCO\b|\bGATORADE\b|\bAGUA\b/.test(n))
    return true;
  return false;
}

/** Cerveza vendible por botella / tobo / caja. */
export function isBeerProduct(name: string): boolean {
  const n = norm(name);
  if (!n || isExcluded(n)) return false;
  return (
    /\bCERVEZA\b/.test(n) ||
    /\bPILSEN\b/.test(n) ||
    /\bSOLERA\b/.test(n) ||
    (/BOTELLA RETORNABLE/.test(n) &&
      (/\bPOLAR\b/.test(n) || /\bLIGHT\b/.test(n) || /\bCLASSIC\b/.test(n)))
  );
}

export function isBarProduct(name: string): boolean {
  const n = norm(name);
  if (!n) return false;
  if (isBeerProduct(name)) return true;
  if (
    /\bWHISK|\bRON\b|\bVINO\b|\bVODKA\b|\bGIN\b|\bTEQUILA\b|\bLICOR\b|\bMOJITO\b|\bSANGRIA\b/.test(
      n,
    )
  ) {
    return true;
  }
  if (
    /\bREFRESCO\b|\bJUGO\b|\bPEPSI\b|\bCOCA\b|\bAGUA\b|\bCAFE\b|\bTRAGO\b|\bCOCTEL\b/.test(
      n,
    )
  ) {
    return true;
  }
  return false;
}

export function isKitchenProduct(name: string): boolean {
  const n = norm(name);
  return /HAMBUR|PIZZA|PERRO|HOT.?DOG|AREPA|SANDWICH|PLATO|ALMUERZO|CENA|COMIDA|TEQUE|EMPANA|PAPAS|NUGGET|POLLO|CARNE|PASTA|PARRILLA|ASADO|ENSALADA|TACO|PATACON|TEQUENO|EMPANADA|WINGS|COSTILLA|PESCADO/.test(
    n,
  );
}

export type DestStation = 'BAR' | 'KITCHEN' | 'OTHER';

export function inferStationClient(name: string): DestStation {
  if (isBarProduct(name)) return 'BAR';
  if (isKitchenProduct(name)) return 'KITCHEN';
  return 'OTHER';
}

export function formatBeerQty(bottles: number): string {
  if (bottles <= 0) return '0';
  const tobos = Math.floor(bottles / BOTTLES_PER_TOBO);
  const loose = bottles % BOTTLES_PER_TOBO;
  if (tobos === 0) return `${bottles} bot`;
  if (loose === 0) {
    return tobos === 1 ? '1 tobo (12 bot)' : `${tobos} tobos (${bottles} bot)`;
  }
  return `${tobos} tob + ${loose} bot`;
}

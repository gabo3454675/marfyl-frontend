/** Helpers locales de fecha (DD/MM/YYYY ↔ YYYY-MM-DD). Sin dependencias. */

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

/** YYYY-MM-DD → DD/MM/YYYY */
export function isoToDisplayDate(isoYmd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoYmd.trim());
  if (!m) return isoYmd;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/**
 * DD/MM/YYYY → YYYY-MM-DD.
 * Devuelve null si el formato es incompleto/inválido o la fecha no existe.
 */
export function displayDateToIso(display: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (!isValidCalendarDate(year, month, day)) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Máscara de digitación: inserta `/` al escribir dígitos (máx. DD/MM/YYYY).
 * También acepta que el usuario pegue ya con barras.
 */
export function maskDisplayDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

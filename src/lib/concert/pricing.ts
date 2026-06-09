/**
 * Boletería — dos precios del flyer por asiento:
 * - Efectivo: priceUsd (ej. $60)
 * - Bolívares: priceUsdBolivares (ej. $70) × tasa BCV
 */
export function usdToBsForConcert(usd: number, exchangeRate: number): number {
  const rate = exchangeRate > 0 ? exchangeRate : 1;
  return Math.round(usd * rate * 100) / 100;
}

export function concertBsPaymentAmount(
  priceUsdBolivares: number,
  exchangeRate: number,
): number {
  return usdToBsForConcert(priceUsdBolivares, exchangeRate);
}

export function formatBsAmount(amount: number): string {
  return amount.toLocaleString('es-VE', { minimumFractionDigits: 2 });
}

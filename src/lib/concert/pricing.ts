/** Convierte USD a Bs con la tasa de la organización (Monddy). */
export function usdToBsForConcert(usd: number, exchangeRate: number): number {
  const rate = exchangeRate > 0 ? exchangeRate : 1;
  return Math.round(usd * rate * 100) / 100;
}

export function formatBsAmount(amount: number): string {
  return amount.toLocaleString('es-VE', { minimumFractionDigits: 2 });
}

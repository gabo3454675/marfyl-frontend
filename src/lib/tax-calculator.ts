import { round2 } from '@/lib/currencyConversion';

export function computeCartIva(
  lines: { amount: number; isExempt?: boolean }[],
): { subtotal: number; ivaAmount: number; total: number; baseGeneral: number; baseExempt: number } {
  let baseGeneral = 0;
  let baseExempt = 0;
  for (const line of lines) {
    const amt = round2(line.amount);
    if (line.isExempt) baseExempt += amt;
    else baseGeneral += amt;
  }
  baseGeneral = round2(baseGeneral);
  baseExempt = round2(baseExempt);
  const ivaAmount = round2(baseGeneral * 0.16);
  const subtotal = round2(baseGeneral + baseExempt);
  const total = round2(subtotal + ivaAmount);
  return { subtotal, ivaAmount, total, baseGeneral, baseExempt };
}

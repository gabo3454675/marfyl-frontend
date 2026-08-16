import { round2 } from '@/lib/currencyConversion';

export function computeCartIva(
  lines: { amount: number; isExempt?: boolean }[],
  options?: { ivaDisabled?: boolean },
): { subtotal: number; ivaAmount: number; total: number; baseGeneral: number; baseExempt: number } {
  let baseGeneral = 0;
  let baseExempt = 0;
  const ivaDisabled = options?.ivaDisabled === true;
  for (const line of lines) {
    const amt = round2(line.amount);
    if (ivaDisabled || line.isExempt) baseExempt += amt;
    else baseGeneral += amt;
  }
  baseGeneral = round2(baseGeneral);
  baseExempt = round2(baseExempt);
  // Desglose de IVA por dentro: salePrice ya incluye IVA → extraer la porción de IVA.
  // Fórmula aprobada: base = round2(monto / 1.16), iva = round2(monto - base)
  const ivaAmount = ivaDisabled ? 0 : round2(baseGeneral - round2(baseGeneral / 1.16));
  const subtotal = round2(baseGeneral + baseExempt);
  // IVA ya está incluido en salePrice → el total es el subtotal (no se suma IVA adicional).
  const total = subtotal;
  return { subtotal, ivaAmount, total, baseGeneral, baseExempt };
}

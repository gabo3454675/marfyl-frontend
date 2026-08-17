/** Modalidad de venta alineada con BE (invoices / floor-orders). */
export type SaleMode = 'STANDARD' | 'DESCORCHE' | 'COMBO';

export const SALE_MODE_LABELS: Record<SaleMode, string> = {
  STANDARD: 'Estándar',
  DESCORCHE: 'Descorche',
  COMBO: 'Combo',
};

/** Reglas UI (= rechazo BE para DESCORCHE; COMBO solo bundles). */
export function allowedSaleModes(product: {
  isService?: boolean;
  isBundle?: boolean;
}): SaleMode[] {
  const modes: SaleMode[] = ['STANDARD'];
  if (product.isService) modes.push('DESCORCHE');
  if (product.isBundle) modes.push('COMBO');
  return modes;
}

export function isSaleModeAllowed(
  mode: SaleMode,
  product: { isService?: boolean; isBundle?: boolean },
): boolean {
  return allowedSaleModes(product).includes(mode);
}

export function normalizeSaleMode(
  raw: string | null | undefined,
  product: { isService?: boolean; isBundle?: boolean },
): SaleMode {
  const mode: SaleMode =
    raw === 'DESCORCHE' || raw === 'COMBO' ? raw : 'STANDARD';
  return isSaleModeAllowed(mode, product) ? mode : 'STANDARD';
}

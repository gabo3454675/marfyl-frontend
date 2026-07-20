import { useMemo } from 'react';
import { useDisplayCurrencyStore } from '@/store/useDisplayCurrencyStore';
import { useExchangeRate } from '@/hooks/useExchangeRate';

export type DisplayCurrency = 'USD' | 'BS';

/** Tasa válida para conversión: nunca 0 ni NaN (fallback 1). Dólar BCV. */
function safeRate(rate: number): number {
  const n = Number(rate);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function formatMoney(amount: number, currency: 'USD' | 'VES'): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Preferencia de moneda para visualizar datos (Dashboard, Facturas, Gastos, Créditos).
 * Convierte montos USD → Bs. con la tasa Dólar BCV de la organización cuando el usuario elige "Bs.".
 * Importante: `formatForDisplay` asume montos en USD. Para montos ya en Bs usar `formatBsAmount`.
 */
export function useDisplayCurrency() {
  const displayCurrency = useDisplayCurrencyStore((s) => s.displayCurrency);
  const setDisplayCurrency = useDisplayCurrencyStore((s) => s.setDisplayCurrency);
  const toggleDisplayCurrency = useDisplayCurrencyStore((s) => s.toggleDisplayCurrency);
  const rawRate = useExchangeRate();
  const exchangeRate = useMemo(() => safeRate(rawRate), [rawRate]);

  const formatUsdAmount = useMemo(() => {
    return (amountUsd: number): string => formatMoney(Number(amountUsd), 'USD');
  }, []);

  const formatBsAmount = useMemo(() => {
    return (amountBs: number): string => formatMoney(Number(amountBs), 'VES');
  }, []);

  const formatForDisplay = useMemo(() => {
    return (amountUsd: number): string => {
      const amount = Number(amountUsd);
      if (!Number.isFinite(amount)) return formatMoney(0, displayCurrency === 'BS' ? 'VES' : 'USD');
      if (displayCurrency === 'BS') {
        return formatMoney(amount * exchangeRate, 'VES');
      }
      return formatMoney(amount, 'USD');
    };
  }, [displayCurrency, exchangeRate]);

  const toDisplayAmount = useMemo(() => {
    return (amountUsd: number): number => {
      const amount = Number(amountUsd);
      if (!Number.isFinite(amount)) return 0;
      return displayCurrency === 'BS' ? amount * exchangeRate : amount;
    };
  }, [displayCurrency, exchangeRate]);

  return {
    displayCurrency,
    setDisplayCurrency,
    toggleDisplayCurrency,
    formatForDisplay,
    formatUsdAmount,
    formatBsAmount,
    toDisplayAmount,
    exchangeRate,
    /** Etiqueta corta para el toggle: "USD" o "Bs." */
    label: displayCurrency === 'BS' ? 'Bs.' : 'USD',
  };
}

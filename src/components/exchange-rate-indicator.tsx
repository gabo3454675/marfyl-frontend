'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

function isRateUpdatedToday(rateUpdatedAt: string | null | undefined): boolean {
  if (!rateUpdatedAt) return false;
  try {
    const d = new Date(rateUpdatedAt);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  } catch {
    return false;
  }
}

function formatRateUpdatedAt(rateUpdatedAt: string | null | undefined): string {
  if (!rateUpdatedAt) return '';
  try {
    const d = new Date(rateUpdatedAt);
    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

interface ExchangeRateIndicatorProps {
  onOpenConfig?: () => void;
  className?: string;
  currency?: 'USD' | 'EUR';
}

/**
 * Indicador de tasa BCV en header. La tasa se sincroniza sola desde el servidor.
 */
export function ExchangeRateIndicator({
  onOpenConfig,
  className,
  currency = 'USD',
}: ExchangeRateIndicatorProps) {
  const [apiRate, setApiRate] = useState<{
    rate: number;
    updatedAt: string | null;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setApiRate(null);
    const endpoint =
      currency === 'EUR'
        ? 'https://ve.dolarapi.com/v1/euros/oficial'
        : 'https://ve.dolarapi.com/v1/dolares/oficial';

    void fetch(endpoint, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`DolarApi HTTP ${response.status}`);
        const quote = await response.json() as {
          promedio?: number | null;
          venta?: number | null;
          compra?: number | null;
          fechaActualizacion?: string | null;
        };
        const rate = Number(quote.promedio ?? quote.venta ?? quote.compra);
        if (!Number.isFinite(rate) || rate <= 0) {
          throw new Error('Cotización EUR inválida');
        }
        setApiRate({ rate, updatedAt: quote.fechaActualizacion ?? null });
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name !== 'AbortError') {
          setApiRate(null);
        }
      });

    return () => controller.abort();
  }, [currency]);

  const rate = apiRate?.rate;
  const hasRate = rate != null && Number.isFinite(Number(rate));
  const isUpToDate = isRateUpdatedToday(apiRate?.updatedAt);
  const rateUpdatedAtFormatted = formatRateUpdatedAt(apiRate?.updatedAt);
  const rateLabel = currency === 'EUR' ? 'Euro BCV' : 'Dólar BCV';
  const isLoading = !apiRate;

  const title = [
    `${rateLabel} — se actualiza automáticamente`,
    rateUpdatedAtFormatted ? `Última sync: ${rateUpdatedAtFormatted}` : undefined,
    onOpenConfig ? 'Clic para ver detalle' : undefined,
  ]
    .filter(Boolean)
    .join('. ');

  const content = (
    <>
      <span
        className={cn(
          'h-2 w-2 shrink-0 rounded-full',
          hasRate && (isUpToDate ? 'bg-emerald-500' : 'bg-amber-500'),
          !hasRate && 'bg-muted-foreground/50',
        )}
        aria-hidden
      />
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
      ) : hasRate ? (
        <span className="tabular-nums">{currency} · Bs. {Number(rate).toFixed(2)}</span>
      ) : (
        <span className="text-muted-foreground tabular-nums">---</span>
      )}
    </>
  );

  if (onOpenConfig) {
    return (
      <button
        type="button"
        onClick={onOpenConfig}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
          'hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'min-h-[44px] touch-manipulation',
          className,
        )}
        title={title}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium',
        'min-h-[44px]',
        className,
      )}
      title={title}
      aria-label={title}
    >
      {content}
    </div>
  );
}

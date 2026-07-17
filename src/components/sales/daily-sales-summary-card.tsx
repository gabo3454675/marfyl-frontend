'use client';

import type { DailySummaryItem } from '@/lib/api';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

function money(n: number | undefined, format: (v: number) => string) {
  return format(Number(n ?? 0));
}

function formatDayLabel(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Intl.DateTimeFormat('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function DailySalesSummaryCard({ day }: { day: DailySummaryItem }) {
  const { formatForDisplay } = useDisplayCurrency();
  const fmt = (v: number) => formatForDisplay(v);
  const currencyEntries = Object.entries(day.byCurrency ?? {});

  return (
    <section className="rounded-xl border border-border/70 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-5 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
      <header className="mb-4 flex flex-col gap-1 border-b border-border/60 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
            Resumen de ventas del día
          </p>
          <h3 className="text-lg font-semibold capitalize text-foreground">
            {formatDayLabel(day.date)}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Expresado en dólares · {day.invoiceCount ?? 0} factura
          {(day.invoiceCount ?? 0) === 1 ? '' : 's'}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Ventas brutas" value={money(day.grossSales ?? day.totalSales, fmt)} />
        <Metric label="Impuestos (IVA)" value={money(day.taxAmount, fmt)} />
        <Metric label="IGTF" value={money(day.igtfAmount, fmt)} />
        <Metric label="Total neto" value={money(day.netSales ?? day.totalSales, fmt)} emphasize />
        <Metric label="Contado" value={money(day.cashTotal ?? day.totalSales, fmt)} />
        <Metric label="Crédito" value={money(day.creditTotal, fmt)} />
        <Metric label="Costo" value={money(day.totalCost, fmt)} />
        <Metric
          label="Utilidad"
          value={`${money(day.totalProfit, fmt)} (${Number(day.profitPercent ?? 0).toFixed(1)}%)`}
          emphasize
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-background/70 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resumen por documento
          </p>
          <dl className="space-y-1 text-sm">
            <Row label="Facturas" value={String(day.invoiceCount ?? 0)} />
            <Row label="Devoluciones" value="0" />
          </dl>
        </div>
        <div className="rounded-lg border border-border/50 bg-background/70 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resumen de monedas
          </p>
          {currencyEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin desglose de moneda</p>
          ) : (
            <dl className="space-y-1 text-sm">
              {currencyEntries.map(([currency, amount]) => (
                <Row
                  key={currency}
                  label={currency === 'VES' ? 'Bolívar' : currency === 'USD' ? 'Dólares' : currency}
                  value={
                    currency === 'VES'
                      ? `Bs ${Number(amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                      : money(amount, fmt)
                  }
                />
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/80 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={
          emphasize
            ? 'mt-0.5 text-base font-bold text-emerald-700 dark:text-emerald-300'
            : 'mt-0.5 text-base font-semibold text-foreground'
        }
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

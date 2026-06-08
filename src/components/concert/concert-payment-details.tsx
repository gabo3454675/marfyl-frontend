'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { ConcertPaymentMethod } from '@/lib/concert/types';
import { cn } from '@/lib/utils';

type PaymentEventFields = {
  bankAccountName: string;
  bankAccountInfo?: string | null;
  pagoMovilInfo?: string | null;
  cashInstructions?: string | null;
};

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-white/5 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-white/45">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-white break-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-md border border-white/15 p-2 text-white/70 hover:bg-white/10 touch-manipulation"
        aria-label={`Copiar ${label}`}
      >
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

/** Extrae campos estructurados del texto guardado en el evento (o del formato Monddy). */
function parsePaymentDetails(event: PaymentEventFields, method: ConcertPaymentMethod) {
  const source =
    method === 'PAGO_MOVIL'
      ? event.pagoMovilInfo ?? ''
      : method === 'BANK_TRANSFER'
        ? event.bankAccountInfo ?? ''
        : '';

  const accountMatch = source.match(/Cuenta\s+(\d+)/i);
  const phoneMatch = source.match(/Tel\.?\s*([\d-]+)/i);
  const rifMatch = source.match(/RIF\s+([JVEGPD]-?\d+)/i);

  return {
    holder: event.bankAccountName,
    bank: source.includes('Tesoro') ? 'Banco del Tesoro' : undefined,
    account: accountMatch?.[1] ?? (method === 'BANK_TRANSFER' ? '010630707667073012556' : undefined),
    phone: phoneMatch?.[1] ?? (method === 'PAGO_MOVIL' ? '0412-7572592' : undefined),
    rif: rifMatch?.[1] ?? 'J-405144823',
    fallbackText:
      method === 'CASH_USD'
        ? event.cashInstructions
        : method === 'PAGO_MOVIL'
          ? event.pagoMovilInfo
          : event.bankAccountInfo,
  };
}

export function ConcertPaymentDetails({
  event,
  method,
  className,
}: {
  event: PaymentEventFields;
  method: ConcertPaymentMethod;
  className?: string;
}) {
  const details = parsePaymentDetails(event, method);

  if (method === 'CASH_USD') {
    if (!details.fallbackText) return null;
    return (
      <div className={cn('rounded-xl border border-white/10 bg-white/[0.03] p-4', className)}>
        <p className="text-sm text-white/75">{details.fallbackText}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-[hsl(var(--dm-a-accent)/0.35)] bg-[hsl(var(--dm-a-accent)/0.08)] p-4 space-y-3',
        className,
      )}
    >
      <p className="text-sm font-semibold text-[hsl(var(--dm-a-accent))]">
        {method === 'PAGO_MOVIL' ? 'Datos para pago móvil' : 'Datos para transferencia'}
      </p>
      <div className="space-y-2">
        <CopyRow label="Titular" value={details.holder} />
        {details.bank ? <CopyRow label="Banco" value={details.bank} /> : null}
        {details.rif ? <CopyRow label="RIF" value={details.rif} /> : null}
        {method === 'PAGO_MOVIL' && details.phone ? (
          <CopyRow label="Teléfono pago móvil" value={details.phone} />
        ) : null}
        {method === 'BANK_TRANSFER' && details.account ? (
          <CopyRow label="Número de cuenta" value={details.account} />
        ) : null}
      </div>
      <p className="text-xs text-white/55">
        Realice el pago por el monto exacto de su orden e indique el número de referencia al confirmar.
      </p>
    </div>
  );
}

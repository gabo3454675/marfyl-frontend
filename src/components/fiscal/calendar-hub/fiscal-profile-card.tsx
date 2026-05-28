'use client';

import Link from 'next/link';
import { Building2, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FiscalCalendarHubViewModel } from '@/types/fiscal-calendar-hub';
import { FiscalHubCard, FiscalHubSectionTitle } from './fiscal-hub-card';
import { cn } from '@/lib/utils';

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          'text-sm font-medium text-right truncate max-w-[55%]',
          ok === false && 'text-amber-600 dark:text-amber-400',
          ok === true && 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function FiscalProfileCard({ data }: { data: FiscalCalendarHubViewModel }) {
  const p = data.profile;
  const taxpayerLabels: Record<string, string> = {
    ORDINARIO: 'Ordinario',
    ESPECIAL: 'Especial',
    FORMAL: 'Formal',
  };

  return (
    <FiscalHubCard delay={0.14}>
      <FiscalHubSectionTitle
        title="Configuración fiscal"
        description="Datos del contribuyente que alimentan el calendario."
      />
      <div className="rounded-xl border border-border/40 bg-muted/15 p-4 space-y-1 dark:bg-slate-800/25">
        <Row label="RIF" value={p.taxId?.trim() || 'Sin configurar'} ok={p.configured} />
        <Row label="Razón social" value={p.legalName?.trim() || '—'} />
        <Row
          label="Tipo contribuyente"
          value={taxpayerLabels[p.taxpayerType] ?? p.taxpayerType}
        />
        <Row
          label="Agente retención IVA"
          value={p.isWithholdingAgent ? 'Sí' : 'No'}
          ok={p.isWithholdingAgent}
        />
        {data.rifDigit != null && (
          <Row label="Terminación RIF" value={String(data.rifDigit)} />
        )}
        {data.terminacionIvaDay != null && (
          <Row label="Día IVA ordinario" value={`Día ${data.terminacionIvaDay} del mes sig.`} />
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <Button size="sm" className="flex-1 sm:flex-none" asChild>
          <Link href="/fiscal/perfil">
            <User className="h-4 w-4 mr-1.5" />
            Editar perfil
          </Link>
        </Button>
        {!p.configured && (
          <p className="w-full text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            Complete el RIF para activar obligaciones
          </p>
        )}
        {(p.isSpecialTaxpayer || p.isFormalTaxpayer) && (
          <p className="w-full text-xs text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            Régimen especial/formal aplicado en reglas SENIAT
          </p>
        )}
      </div>
    </FiscalHubCard>
  );
}

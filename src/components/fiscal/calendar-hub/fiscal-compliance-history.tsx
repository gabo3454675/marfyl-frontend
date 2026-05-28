'use client';

import { History } from 'lucide-react';
import type { FiscalCalendarHubViewModel } from '@/types/fiscal-calendar-hub';
import { FiscalHubCard, FiscalHubSectionTitle } from './fiscal-hub-card';

const typeLabels: Record<string, string> = {
  sync: 'Sincronización',
  rules: 'Reglas',
  compliance: 'Cumplimiento',
  config: 'Configuración',
};

export function FiscalComplianceHistory({ data }: { data: FiscalCalendarHubViewModel }) {
  const events = data.history;

  return (
    <FiscalHubCard delay={0.2}>
      <FiscalHubSectionTitle
        title="Historial"
        description="Últimas sincronizaciones y eventos de cumplimiento."
      />
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center rounded-xl border border-dashed">
          Aún no hay eventos. Sincronice reglas para comenzar el historial.
        </p>
      ) : (
        <ul className="space-y-0 max-h-[280px] overflow-y-auto pr-1 sidebar-scroll">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex gap-3 py-3 border-b border-border/30 last:border-0"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <History className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{e.label}</p>
                {e.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5">{e.detail}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {typeLabels[e.type] ?? e.type} ·{' '}
                  {new Date(e.at).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </FiscalHubCard>
  );
}

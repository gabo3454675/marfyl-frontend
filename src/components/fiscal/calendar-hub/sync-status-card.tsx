'use client';

import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FiscalCalendarHubViewModel } from '@/types/fiscal-calendar-hub';
import { FiscalHubCard, FiscalHubSectionTitle } from './fiscal-hub-card';
import { cn } from '@/lib/utils';

function formatSync(iso: string | null) {
  if (!iso) return 'Nunca';
  return new Date(iso).toLocaleString('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function SyncStatusCard({
  data,
  onSync,
  syncing,
}: {
  data: FiscalCalendarHubViewModel;
  onSync: () => void;
  syncing?: boolean;
}) {
  const online = data.backendOnline && !data.fromMock;

  return (
    <FiscalHubCard delay={0.18}>
      <FiscalHubSectionTitle title="Sincronización" description="Estado de reglas y conexión con el backend." />
      <div
        className={cn(
          'rounded-xl border p-4 flex items-start gap-3',
          online
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-amber-500/30 bg-amber-500/5',
        )}
      >
        {online ? (
          <Cloud className="h-8 w-8 text-emerald-500 shrink-0" />
        ) : (
          <CloudOff className="h-8 w-8 text-amber-500 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">
            {online ? 'Backend conectado' : 'Modo demo / sin backend'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.seniatVersion ? `Reglas: v${data.seniatVersion}` : 'Sin versión de reglas cargada'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Última sync: <strong className="text-foreground">{formatSync(data.lastSyncAt)}</strong>
          </p>
        </div>
      </div>
      <Button className="w-full mt-4" onClick={onSync} disabled={syncing}>
        <RefreshCw className={cn('h-4 w-4 mr-2', syncing && 'animate-spin')} />
        Sincronizar reglas SENIAT
      </Button>
    </FiscalHubCard>
  );
}

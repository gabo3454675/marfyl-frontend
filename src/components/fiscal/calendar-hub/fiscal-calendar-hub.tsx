'use client';

import Link from 'next/link';
import { Loader2, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { FiscalCalendarHubViewModel } from '@/types/fiscal-calendar-hub';
import { PeriodFilterBar } from './period-filter-bar';
import { FiscalHealthSummary } from './fiscal-health-summary';
import { UpcomingObligations } from './upcoming-obligations';
import { FiscalAlerts } from './fiscal-alerts';
import { FiscalProfileCard } from './fiscal-profile-card';
import { SyncStatusCard } from './sync-status-card';
import { FiscalComplianceHistory } from './fiscal-compliance-history';
import { FiscalCalendarSkeleton } from './fiscal-calendar-skeleton';
import { FiscalDiagnosticBanner } from './fiscal-diagnostic-banner';

export function FiscalCalendarHub({
  year,
  month,
  onYearChange,
  onMonthChange,
  data,
  loading,
  syncing,
  error,
  onReload,
  onSync,
}: {
  year: number;
  month: number;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
  data: FiscalCalendarHubViewModel | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  onReload: () => void;
  onSync: () => Promise<boolean>;
}) {
  const handleSync = async () => {
    const ok = await onSync();
    if (ok) toast.success('Reglas SENIAT sincronizadas');
    else toast.error('Error al sincronizar');
  };

  return (
    <div className="fiscal-hub-root fiscal-hub-mesh space-y-5 sm:space-y-6 rounded-2xl w-full min-w-0">
      {error && (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {error}
        </div>
      )}

      <PeriodFilterBar
        year={year}
        month={month}
        onYearChange={onYearChange}
        onMonthChange={onMonthChange}
        onRefresh={onReload}
        loading={loading}
      />

      {loading ? (
        <FiscalCalendarSkeleton />
      ) : data ? (
        <div className="space-y-6">
          <FiscalDiagnosticBanner mode={data.mode} reasons={data.modeReasons} />
          <FiscalHealthSummary data={data} />

          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-6 lg:col-span-1 xl:col-span-2">
              <UpcomingObligations data={data} onSync={handleSync} syncing={syncing} />
              <FiscalAlerts data={data} />
            </div>
            <div className="space-y-6">
              <FiscalProfileCard data={data} />
              <SyncStatusCard data={data} onSync={handleSync} syncing={syncing} />
              <FiscalComplianceHistory data={data} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FiscalCalendarHubActions({
  onSync,
  syncing,
}: {
  onSync: () => void;
  syncing?: boolean;
}) {
  return (
    <>
      <Button variant="outline" size="sm" asChild>
        <Link href="/fiscal/perfil">
          <Settings className="h-4 w-4 mr-2" />
          Perfil fiscal
        </Link>
      </Button>
      <Button size="sm" onClick={onSync} disabled={syncing}>
        {syncing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        Sincronizar reglas
      </Button>
    </>
  );
}

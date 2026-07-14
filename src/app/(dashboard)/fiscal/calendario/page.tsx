'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiscalShell } from '@/components/fiscal/fiscal-shell';
import {
  FiscalCalendarHub,
  FiscalCalendarHubActions,
} from '@/components/fiscal/calendar-hub/fiscal-calendar-hub';
import { usePermission } from '@/hooks/usePermission';
import { useFiscalCalendarHub } from '@/hooks/useFiscalCalendarHub';
import { toast } from 'sonner';
import { ContentFaqSheet } from '@/components/help/content-faq-sheet';
import { FISCAL_FAQ } from '@/lib/content/faq-content';

export default function FiscalCalendarioPage() {
  const router = useRouter();
  const { canManageFiscal } = usePermission();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { data, loading, syncing, error, reload, syncRules } = useFiscalCalendarHub(year, month);

  useEffect(() => {
    if (!canManageFiscal) router.replace('/dashboard');
  }, [canManageFiscal, router]);

  const handleSyncHeader = async () => {
    const ok = await syncRules();
    if (ok) toast.success('Reglas SENIAT sincronizadas');
    else toast.error('No se pudo sincronizar');
  };

  if (!canManageFiscal) return null;

  return (
    <FiscalShell
      title="Calendario fiscal SENIAT"
      subtitle="Panel de salud fiscal, vencimientos y alertas según su perfil (IVA, retenciones, IGTF e ISLR)."
      actions={
        <>
          <ContentFaqSheet
            title="Cumplimiento fiscal"
            description="Perfil RIF, calendario SENIAT, alertas y sincronización de reglas."
            items={FISCAL_FAQ}
            triggerLabel="FAQ fiscal"
            variant="ghost"
          />
          <FiscalCalendarHubActions onSync={handleSyncHeader} syncing={syncing} />
        </>
      }
    >
      <FiscalCalendarHub
        year={year}
        month={month}
        onYearChange={setYear}
        onMonthChange={setMonth}
        data={data}
        loading={loading}
        syncing={syncing}
        error={error}
        onReload={reload}
        onSync={syncRules}
      />
    </FiscalShell>
  );
}

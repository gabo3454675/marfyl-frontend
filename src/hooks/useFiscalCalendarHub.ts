'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fiscalService } from '@/lib/api';
import {
  buildCalendarHubViewModel,
  buildHubFromComplianceApi,
  mapProfileToSnapshot,
} from '@/lib/fiscal/calendar-hub-mapper';
import { mockHubViewModel } from '@/lib/fiscal/calendar-hub-mock';
import type {
  CalendarApiResponse,
  FiscalCalendarHubViewModel,
  FiscalHistoryEvent,
} from '@/types/fiscal-calendar-hub';

const HISTORY_KEY = 'marfyl-fiscal-sync-history';

function loadHistory(): FiscalHistoryEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as FiscalHistoryEvent[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(events: FiscalHistoryEvent[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(events.slice(0, 20)));
}

function pushHistory(type: FiscalHistoryEvent['type'], label: string, detail?: string) {
  const events = loadHistory();
  const entry: FiscalHistoryEvent = {
    id: `${Date.now()}`,
    at: new Date().toISOString(),
    type,
    label,
    detail,
  };
  const next = [entry, ...events].slice(0, 20);
  saveHistory(next);
  return next;
}

export function useFiscalCalendarHub(year: number, month: number) {
  const [data, setData] = useState<FiscalCalendarHubViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<FiscalHistoryEvent[]>(loadHistory());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let backendOnline = true;
    let cal: CalendarApiResponse | null = null;
    let profileSnapshot = mapProfileToSnapshot({});

    try {
      const hubRes = await fiscalService.getComplianceHub({ year, month });
      historyRef.current = loadHistory();
      const vm = buildHubFromComplianceApi(hubRes, {
        backendOnline: true,
        history: historyRef.current,
        fromMock: false,
      });
      setData(vm);
      setLoading(false);
      return;
    } catch {
      // Fallback a endpoints legacy si la migración de cumplimiento aún no está aplicada
    }

    try {
      const [calRes, profileRes] = await Promise.all([
        fiscalService.listCalendar({ year, month }),
        fiscalService.getProfile(),
      ]);
      cal = calRes;
      profileSnapshot = mapProfileToSnapshot(profileRes as Parameters<typeof mapProfileToSnapshot>[0]);
    } catch {
      backendOnline = false;
      const mock = mockHubViewModel(year, month, true);
      setData(mock);
      setError('Sin conexión al backend. Mostrando vista demo — configure perfil y sincronice reglas.');
      setLoading(false);
      return;
    }

    historyRef.current = loadHistory();
    const lastSync = historyRef.current.find((e) => e.type === 'sync')?.at ?? null;
    const vm = buildCalendarHubViewModel(cal!, profileSnapshot, {
      backendOnline,
      lastSyncAt: lastSync,
      history: historyRef.current,
      fromMock: false,
    });
    setData(vm);
    setLoading(false);
  }, [year, month]);

  const syncRules = useCallback(async () => {
    setSyncing(true);
    try {
      await fiscalService.syncCalendario({ force: true });
      historyRef.current = pushHistory('sync', 'Reglas SENIAT sincronizadas', `Período ${month}/${year}`);
      await load();
      return true;
    } catch {
      setError('No se pudo sincronizar. Verifique el backend en :3001.');
      return false;
    } finally {
      setSyncing(false);
    }
  }, [load, month, year]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, syncing, error, reload: load, syncRules };
}

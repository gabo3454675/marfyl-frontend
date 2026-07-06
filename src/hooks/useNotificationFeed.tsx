'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import apiClient, { fiscalService } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api/get-error-message';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import type { TaskForResolution } from '@/components/task-resolution-modal';
import {
  buildNotificationFeedItems,
  countActionableFeedItems,
  type FiscalFeedSnapshot,
  type NotificationFeedItem,
} from '@/lib/notifications/feed-builder';

export type { FeedItemKind, NotificationFeedItem } from '@/lib/notifications/feed-builder';

type NotificationFeedContextValue = {
  feedItems: NotificationFeedItem[];
  myTasks: TaskForResolution[];
  badgeCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const NotificationFeedContext = createContext<NotificationFeedContextValue | null>(null);

const POLL_MS = 10 * 60 * 1000;

export function NotificationFeedProvider({ children }: { children: ReactNode }) {
  const selectedOrganizationId = useAuthStore((s) => s.selectedOrganizationId);
  const selectedCompanyId = useAuthStore((s) => s.selectedCompanyId);
  const { canManageFiscal } = usePermission();

  const selectedId = selectedOrganizationId ?? selectedCompanyId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myTasks, setMyTasks] = useState<TaskForResolution[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<
    { id: number; status: string; createdAt?: string; customerName?: string }[]
  >([]);
  const [lowStockProducts, setLowStockProducts] = useState<
    { id: number; sku?: string | null; name: string; stock: number }[]
  >([]);
  const [fiscal, setFiscal] = useState<FiscalFeedSnapshot | null>(null);
  const [fiscalLoadError, setFiscalLoadError] = useState<string | null>(null);
  const [operationalErrors, setOperationalErrors] = useState<string[]>([]);

  /** Evita re-fetchs si la última carga fue hace menos de 60s */
  const lastFetchRef = useRef<number>(0);

  const loadData = useCallback(async (force?: boolean) => {
    const ts = Date.now();
    if (!force && ts - lastFetchRef.current < 60_000) return;
    lastFetchRef.current = ts;
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const opErrors: string[] = [];

    try {
      setLoading(true);
      setError(null);
      setFiscalLoadError(null);
      setOperationalErrors([]);

      const [tasksRes, invoicesRes, productsRes] = await Promise.allSettled([
        apiClient.get<TaskForResolution[]>('/tasks/my-pending'),
        apiClient.get<typeof pendingInvoices>('/dashboard/pending-invoices'),
        apiClient.get<typeof lowStockProducts>('/dashboard/low-stock'),
      ]);

      if (tasksRes.status === 'fulfilled') {
        setMyTasks(Array.isArray(tasksRes.value.data) ? tasksRes.value.data : []);
      } else {
        setMyTasks([]);
        opErrors.push(getApiErrorMessage(tasksRes.reason, 'No se pudieron cargar tus tareas pendientes.'));
      }

      if (invoicesRes.status === 'fulfilled') {
        setPendingInvoices(Array.isArray(invoicesRes.value.data) ? invoicesRes.value.data : []);
      } else {
        setPendingInvoices([]);
        opErrors.push(
          getApiErrorMessage(invoicesRes.reason, 'No se pudieron cargar facturas pendientes de cobro.'),
        );
      }

      if (productsRes.status === 'fulfilled') {
        setLowStockProducts(Array.isArray(productsRes.value.data) ? productsRes.value.data : []);
      } else {
        setLowStockProducts([]);
        opErrors.push(getApiErrorMessage(productsRes.reason, 'No se pudieron cargar alertas de inventario.'));
      }

      if (canManageFiscal) {
        try {
          const hub = await fiscalService.getComplianceHub({ year, month });
          setFiscal({
            mode: hub.mode,
            modeReasons: hub.modeReasons ?? [],
            alerts: hub.alerts ?? [],
            overdue: hub.health?.overdue ?? 0,
            upcoming: hub.health?.upcoming ?? 0,
            criticalAlerts: hub.health?.criticalAlerts ?? 0,
            missingConfig: hub.health?.missingConfig ?? 0,
            backendOnline: true,
            profileConfigured: hub.identity?.configured ?? false,
          });
        } catch (e: unknown) {
          setFiscal(null);
          const err = e as { response?: { data?: { message?: string } }; message?: string };
          setFiscalLoadError(getApiErrorMessage(e, 'Verifique conexión y perfil fiscal.'));
        }
      } else {
        setFiscal(null);
        setFiscalLoadError(null);
      }

      setOperationalErrors(opErrors);
      setError(null);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Error al cargar alertas'));
      setMyTasks([]);
      setPendingInvoices([]);
      setLowStockProducts([]);
      setFiscal(null);
    } finally {
      setLoading(false);
    }
  }, [canManageFiscal]);

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 2000);
    return () => clearTimeout(timer);
  }, [loadData, selectedId]);

  useEffect(() => {
    const id = window.setInterval(() => loadData(), POLL_MS);
    return () => window.clearInterval(id);
  }, [loadData]);

  useEffect(() => {
    const onTasksUpdated = () => loadData(true);
    const onRateUpdated = () => loadData(true);
    const onOrgChanged = () => loadData(true);
    window.addEventListener('tasks-updated', onTasksUpdated);
    window.addEventListener('organization-rate-updated', onRateUpdated);
    window.addEventListener('organization-changed', onOrgChanged);
    return () => {
      window.removeEventListener('tasks-updated', onTasksUpdated);
      window.removeEventListener('organization-rate-updated', onRateUpdated);
      window.removeEventListener('organization-changed', onOrgChanged);
    };
  }, [loadData]);

  const feedItems = useMemo(
    () =>
      buildNotificationFeedItems({
        myTasks,
        pendingInvoices,
        lowStockProducts,
        fiscal,
        fiscalLoadError,
        operationalErrors,
      }),
    [
      myTasks,
      pendingInvoices,
      lowStockProducts,
      fiscal,
      fiscalLoadError,
      operationalErrors,
    ],
  );

  const badgeCount = useMemo(() => countActionableFeedItems(feedItems), [feedItems]);

  const value = useMemo(
    () => ({ feedItems, myTasks, badgeCount, loading, error, refetch: loadData }),
    [feedItems, myTasks, badgeCount, loading, error, loadData],
  );

  return (
    <NotificationFeedContext.Provider value={value}>{children}</NotificationFeedContext.Provider>
  );
}

export function useNotificationFeed(): NotificationFeedContextValue {
  const ctx = useContext(NotificationFeedContext);
  if (!ctx) {
    throw new Error('useNotificationFeed debe usarse dentro de NotificationFeedProvider');
  }
  return ctx;
}

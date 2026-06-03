'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

function isRateStaleForToday(rateUpdatedAt: string | null | undefined): boolean {
  if (rateUpdatedAt == null || rateUpdatedAt === '') return true;
  const d = new Date(rateUpdatedAt);
  if (Number.isNaN(d.getTime())) return true;
  const today = new Date();
  return (
    d.getFullYear() !== today.getFullYear() ||
    d.getMonth() !== today.getMonth() ||
    d.getDate() !== today.getDate()
  );
}

type NotificationFeedContextValue = {
  feedItems: NotificationFeedItem[];
  badgeCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const NotificationFeedContext = createContext<NotificationFeedContextValue | null>(null);

const POLL_MS = 5 * 60 * 1000;

export function NotificationFeedProvider({ children }: { children: ReactNode }) {
  const selectedOrganizationId = useAuthStore((s) => s.selectedOrganizationId);
  const selectedCompanyId = useAuthStore((s) => s.selectedCompanyId);
  const user = useAuthStore((s) => s.user);
  const superAdminOrganizations = useAuthStore((s) => s.superAdminOrganizations);
  const { canManageFiscal } = usePermission();

  const selectedId = selectedOrganizationId ?? selectedCompanyId;

  const rateUpdatedAt = useMemo(() => {
    if (!selectedId) return null as string | null | undefined;
    if (user?.isSuperAdmin && superAdminOrganizations.length > 0) {
      const o = superAdminOrganizations.find((x) => x.id === selectedId);
      return o && 'rateUpdatedAt' in o ? (o as { rateUpdatedAt?: string | null }).rateUpdatedAt : null;
    }
    const fromUser =
      user?.organizations?.find((o) => o.id === selectedId) ||
      user?.companies?.find((c) => c.id === selectedId);
    if (fromUser && 'rateUpdatedAt' in fromUser) {
      return (fromUser as { rateUpdatedAt?: string | null }).rateUpdatedAt;
    }
    return null;
  }, [selectedId, user, superAdminOrganizations]);

  const showRateReminder = isRateStaleForToday(rateUpdatedAt);

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

  const loadData = useCallback(async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
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
    loadData();
  }, [loadData, selectedId]);

  useEffect(() => {
    const id = window.setInterval(() => loadData(), POLL_MS);
    return () => window.clearInterval(id);
  }, [loadData]);

  useEffect(() => {
    const onTasksUpdated = () => loadData();
    const onRateUpdated = () => loadData();
    const onOrgChanged = () => loadData();
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
        showRateReminder,
        fiscal,
        fiscalLoadError,
        operationalErrors,
      }),
    [
      myTasks,
      pendingInvoices,
      lowStockProducts,
      showRateReminder,
      fiscal,
      fiscalLoadError,
      operationalErrors,
    ],
  );

  const badgeCount = useMemo(() => countActionableFeedItems(feedItems), [feedItems]);

  const value = useMemo(
    () => ({ feedItems, badgeCount, loading, error, refetch: loadData }),
    [feedItems, badgeCount, loading, error, loadData],
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

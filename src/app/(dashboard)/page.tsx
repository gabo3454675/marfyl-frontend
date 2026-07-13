'use client';

import { useEffect, useState, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useInViewport } from '@/hooks/useInViewport';
import { ListTodo, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminCard } from '@/components/admin/admin-card';
import { AdminPanel } from '@/components/admin/admin-panel';
import { AdminMotionStagger, AdminMotionItem } from '@/components/admin/admin-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { isFiscalPreviewMode, seedFiscalPreviewAuth } from '@/lib/fiscal-preview';
import { getApiErrorMessage, isNetworkFailure, PREVIEW_OFFLINE_HINT } from '@/lib/api/get-error-message';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { usePermission } from '@/hooks/usePermission';
import { useNotificationFeed } from '@/hooks/useNotificationFeed';
import apiClient from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  withDemoSummary,
  withDemoHealth,
  withDemoDiagnosis,
  withDemoStrategy,
  DEMO_SUMMARY,
  DEMO_HEALTH,
  EMPTY_SUMMARY,
  EMPTY_HEALTH,
  DEMO_DIAGNOSIS,
  DEMO_STRATEGY,
} from '@/components/dashboard/demo-data';
const DashboardHealthSection = dynamic(
  () => import('@/components/dashboard/dashboard-health-section').then((m) => ({ default: m.DashboardHealthSection })),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> },
);

const OperationalKpiGrid = dynamic(
  () => import('@/components/dashboard/operational-kpi-grid').then((m) => ({ default: m.OperationalKpiGrid })),
  { ssr: false },
);

const PendingTasksPanel = dynamic(
  () => import('@/components/dashboard/pending-tasks-panel').then((m) => ({ default: m.PendingTasksPanel })),
  { ssr: false },
);

const RecentTransactionsPanel = dynamic(
  () => import('@/components/dashboard/recent-transactions-panel').then((m) => ({ default: m.RecentTransactionsPanel })),
  { ssr: false },
);
import type {
  CreatedByMeTask,
  DashboardDiagnosis,
  DashboardHealth,
  DashboardStrategy,
  DashboardSummary,
  PendingTask,
} from '@/components/dashboard/types';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, selectedOrganizationId, selectedCompanyId } = useAuthStore();
  const { myTasks, loading: feedTasksLoading, refetch: refetchFeedTasks } = useNotificationFeed();
  const selectedId = selectedOrganizationId || selectedCompanyId;
  const { canViewFinancialCharts, isSuperAdmin, isAdmin, isManager, isPosOnlySeller } = usePermission();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isPosOnlySeller) router.replace('/pos');
  }, [isPosOnlySeller, router]);

  // ── State para datos transformados (demo data, etc.) ──
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [createdByMeTasks, setCreatedByMeTasks] = useState<CreatedByMeTask[]>([]);
  const [health, setHealth] = useState<DashboardHealth>(EMPTY_HEALTH);
  const [diagnosis, setDiagnosis] = useState<DashboardDiagnosis>(DEMO_DIAGNOSIS);
  const [strategy, setStrategy] = useState<DashboardStrategy>(DEMO_STRATEGY);
  const [error, setError] = useState<string | null>(null);
  const [useDemoData, setUseDemoData] = useState(false);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState('');

  const canSeeCreatedByMe = isSuperAdmin || isAdmin || isManager;
  const { formatForDisplay } = useDisplayCurrency();
  const canLoadDashboard = isAuthenticated || isFiscalPreviewMode();

  // ── Lazy section refs: queries solo se disparan cuando la sección está cerca del viewport ──
  const [chartsRef, chartsVisible] = useInViewport({ rootMargin: '300px' });
  const [tasksCreatedRef, tasksCreatedVisible] = useInViewport({ rootMargin: '200px' });
  const [recentTxRef, recentTxVisible] = useInViewport({ rootMargin: '200px' });

  // ── React Query hooks (staleTime 30s via queryClient default) ──

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary', selectedId],
    queryFn: () => apiClient.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
    enabled: canLoadDashboard && !!selectedId,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });

  const healthQuery = useQuery({
    queryKey: ['dashboard-health', selectedId],
    queryFn: () => apiClient.get<DashboardHealth>('/dashboard/health').then((r) => r.data),
    enabled: canLoadDashboard && !!selectedId && canViewFinancialCharts,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });

  const diagnosisQuery = useQuery({
    queryKey: ['dashboard-diagnosis', selectedId],
    queryFn: () => apiClient.get<DashboardDiagnosis>('/dashboard/diagnosis').then((r) => r.data),
    enabled: canLoadDashboard && !!selectedId && canViewFinancialCharts && chartsVisible,
    staleTime: 60_000,
  });

  const strategyQuery = useQuery({
    queryKey: ['dashboard-strategy', selectedId],
    queryFn: () => apiClient.get<DashboardStrategy>('/dashboard/strategy').then((r) => r.data),
    enabled: canLoadDashboard && !!selectedId && canViewFinancialCharts && chartsVisible,
    staleTime: 60_000,
  });

  const createdByMeQuery = useQuery({
    queryKey: ['tasks-created-by-me', selectedId],
    queryFn: () =>
      apiClient.get<CreatedByMeTask[]>('/tasks/created-by-me').then((r) =>
        Array.isArray(r.data) ? r.data : [],
      ),
    enabled: canLoadDashboard && !!selectedId && canSeeCreatedByMe && tasksCreatedVisible,
  });

  const filteredTasksQuery = useQuery({
    queryKey: ['tasks-filtered', selectedId, taskCategoryFilter],
    queryFn: () =>
      apiClient
        .get<PendingTask[]>(`/tasks/my-pending?category=${encodeURIComponent(taskCategoryFilter)}`)
        .then((r) => (Array.isArray(r.data) ? r.data : [])),
    enabled: canLoadDashboard && !!selectedId && !!taskCategoryFilter,
  });

  // ── Loading flags (derivados de queries) ──
  const loadingSummary = summaryQuery.isPending && summaryQuery.isFetching;
  const loadingHealth = healthQuery.isPending && healthQuery.isFetching;
  const loadingDiagnosis = canViewFinancialCharts ? (diagnosisQuery.isPending && diagnosisQuery.isFetching) : false;
  const loadingStrategy = canViewFinancialCharts ? (strategyQuery.isPending && strategyQuery.isFetching) : false;
  const loadingCreatedByMe = canSeeCreatedByMe ? (createdByMeQuery.isPending && createdByMeQuery.isFetching) : false;
  const loadingTasks = taskCategoryFilter ? (filteredTasksQuery.isPending && filteredTasksQuery.isFetching) : false;

  // ── Sincronizar queries → estado con lógica demo ──

  // Summary + detección de demo
  useEffect(() => {
    if (canLoadDashboard && !selectedId) {
      setError('No hay empresa seleccionada. Por favor, selecciona una empresa.');
      setSummary(DEMO_SUMMARY);
      setHealth(EMPTY_HEALTH);
      setDiagnosis(DEMO_DIAGNOSIS);
      setStrategy(DEMO_STRATEGY);
      return;
    }
    if (!summaryQuery.data && !summaryQuery.isError) return;

    if (summaryQuery.isError) {
      const err = summaryQuery.error;
      const offline = isNetworkFailure(err);
      setError(
        offline && isFiscalPreviewMode()
          ? PREVIEW_OFFLINE_HINT
          : getApiErrorMessage(err, 'Error al cargar los datos del dashboard'),
      );
      setSummary(DEMO_SUMMARY);
      return;
    }

    setError(null);
    const rawSummary = {
      ...DEMO_SUMMARY,
      ...summaryQuery.data,
      totalSalesYesterday: summaryQuery.data!.totalSalesYesterday ?? 0,
    };
    const isEmpty =
      rawSummary.totalSalesToday === 0 &&
      rawSummary.productsCount === 0 &&
      rawSummary.recentTransactions.length === 0;
    setUseDemoData(isFiscalPreviewMode() && isEmpty);
    setSummary(withDemoSummary(rawSummary, isFiscalPreviewMode() && isEmpty));
  }, [summaryQuery.data, summaryQuery.isError, summaryQuery.error, canLoadDashboard, selectedId]);

  // Health
  useEffect(() => {
    if (canLoadDashboard && !selectedId) return;
    if (!healthQuery.data && !healthQuery.isError) return;
    const rawHealth = healthQuery.data ?? EMPTY_HEALTH;
    setHealth(withDemoHealth(rawHealth, isFiscalPreviewMode() && useDemoData));
  }, [healthQuery.data, healthQuery.isError, useDemoData, canLoadDashboard, selectedId]);

  // Diagnosis
  useEffect(() => {
    if (!diagnosisQuery.data && !diagnosisQuery.isError) return;
    const rawDiagnosis = { ...DEMO_DIAGNOSIS, ...(diagnosisQuery.data ?? {}) };
    setDiagnosis(withDemoDiagnosis(rawDiagnosis, isFiscalPreviewMode() && useDemoData));
  }, [diagnosisQuery.data, diagnosisQuery.isError, useDemoData]);

  // Strategy
  useEffect(() => {
    if (!strategyQuery.data && !strategyQuery.isError) return;
    const rawStrategy = { ...DEMO_STRATEGY, ...(strategyQuery.data ?? {}) };
    setStrategy(withDemoStrategy(rawStrategy, isFiscalPreviewMode() && useDemoData));
  }, [strategyQuery.data, strategyQuery.isError, useDemoData]);

  // Created-by-me tasks
  useEffect(() => {
    if (createdByMeQuery.isPending) return;
    setCreatedByMeTasks(createdByMeQuery.data ?? []);
  }, [createdByMeQuery.data, createdByMeQuery.isPending]);

  // Filtered tasks
  useEffect(() => {
    if (filteredTasksQuery.isPending) return;
    setPendingTasks(filteredTasksQuery.data ?? []);
  }, [filteredTasksQuery.data, filteredTasksQuery.isPending]);

  // ── Render helpers ──

  const displayedTasks: PendingTask[] = taskCategoryFilter
    ? pendingTasks
    : myTasks.map((t) => {
        const task = t as unknown as PendingTask;
        return {
          ...task,
          createdAt: task.createdAt ?? new Date().toISOString(),
          createdBy: task.createdBy ?? { id: 0, fullName: null, email: '' },
          organization: task.organization ?? { id: 0, nombre: '' },
        };
      });
  const tasksLoadingFlag = taskCategoryFilter ? loadingTasks : feedTasksLoading;

  useLayoutEffect(() => {
    if (isFiscalPreviewMode()) seedFiscalPreviewAuth();
  }, []);

  // Evento: tareas actualizadas → invalidar caché + refetch feed
  useEffect(() => {
    const onTasksUpdated = () => {
      refetchFeedTasks();
      if (taskCategoryFilter) {
        queryClient.invalidateQueries({ queryKey: ['tasks-filtered', selectedId] });
      }
      if (canSeeCreatedByMe && selectedId) {
        queryClient.invalidateQueries({ queryKey: ['tasks-created-by-me', selectedId] });
      }
    };
    window.addEventListener('tasks-updated', onTasksUpdated);
    return () => window.removeEventListener('tasks-updated', onTasksUpdated);
  }, [refetchFeedTasks, taskCategoryFilter, canSeeCreatedByMe, selectedId, queryClient]);

  useEffect(() => {
    if (!isAuthenticated && !isFiscalPreviewMode()) router.push('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated && !isFiscalPreviewMode()) return null;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const userName = user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario';

  return (
    <div className="w-full min-w-0">
      <AdminPageHeader
        eyebrow="Panel de control"
        title={`${greeting()}, ${userName}.`}
        subtitle="Resumen operativo, alertas fiscales y salud estratégica de tu negocio hoy."
        className="mb-6 md:mb-8"
      />

      {error && !loadingSummary && (() => {
        const previewOffline =
          isFiscalPreviewMode() &&
          (error.includes('Vista previa') || error.includes('puerto 3001') || error.includes('conexión'));
        return (
          <AdminCard
            className={cn('mb-8', previewOffline ? 'border-amber-500/40 bg-amber-500/10' : 'border-destructive bg-destructive/10')}
            title={<span className={previewOffline ? 'text-amber-200' : 'text-destructive'}>{previewOffline ? 'Datos no disponibles (vista previa)' : 'Error'}</span>}
          >
            <p className={cn('mb-4 text-sm leading-relaxed', previewOffline ? 'text-amber-100/90' : 'text-destructive')}>{error}</p>
            <Button onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['dashboard-summary', selectedId] });
              queryClient.invalidateQueries({ queryKey: ['dashboard-health', selectedId] });
              if (canViewFinancialCharts) {
                queryClient.invalidateQueries({ queryKey: ['dashboard-diagnosis', selectedId] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-strategy', selectedId] });
              }
              if (canSeeCreatedByMe && selectedId) {
                queryClient.invalidateQueries({ queryKey: ['tasks-created-by-me', selectedId] });
              }
            }} variant="outline" className="cursor-pointer">Reintentar conexión</Button>
          </AdminCard>
        );
      })()}

      <AdminMotionStagger key={selectedId ?? 'none'} className="admin-page-body">
          {useDemoData && !loadingSummary && (
            <AdminMotionItem>
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Mostrando datos de demostración. Registra ventas e inventario para ver métricas reales.
              </div>
            </AdminMotionItem>
          )}

          <AdminMotionItem>
            <OperationalKpiGrid
              summary={summary}
              health={health}
              formatForDisplay={formatForDisplay}
              loadingSummary={loadingSummary}
              loadingHealth={loadingHealth}
              isDemo={useDemoData}
              canViewFinancialCharts={canViewFinancialCharts}
            />
          </AdminMotionItem>

          <AdminMotionItem>
            <PendingTasksPanel
              tasks={displayedTasks}
              loading={tasksLoadingFlag}
              taskCategoryFilter={taskCategoryFilter}
              onFilterChange={setTaskCategoryFilter}
            />
          </AdminMotionItem>

          {canSeeCreatedByMe && (
            <AdminMotionItem>
              <div ref={tasksCreatedRef}>
              <AdminPanel className="mb-2 md:mb-4">
                <div className="p-4 sm:p-6">
                  <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                    <ListTodo className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    Tareas que asigné
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-4">Estado actualizado por el equipo</p>
                  {loadingCreatedByMe ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : createdByMeTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No has asignado tareas aún</p>
                  ) : (
                    <div className="space-y-3">
                      {createdByMeTasks.map((t) => (
                        <div key={t.id} className="flex items-start justify-between gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground">{t.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Asignada a: {t.assignedTo?.fullName || t.assignedTo?.email} • {t.organization?.nombre}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={
                              t.status === 'DONE'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : t.status === 'IN_PROGRESS'
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                                  : 'bg-slate-500/20 text-slate-400 border-slate-500/40'
                            }
                          >
                            {t.status === 'PENDING' ? 'Pendiente' : t.status === 'IN_PROGRESS' ? 'En progreso' : 'Completada'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AdminPanel>
              </div>
            </AdminMotionItem>
          )}

          {canViewFinancialCharts && (
            <AdminMotionItem>
              <div ref={chartsRef}>
              <DashboardHealthSection
                summary={summary}
                health={health}
                diagnosis={diagnosis}
                strategy={strategy}
                loadingHealth={loadingHealth}
                loadingDiagnosis={loadingDiagnosis}
                loadingStrategy={loadingStrategy}
                formatForDisplay={formatForDisplay}
                isDemo={useDemoData}
                onProductClick={(id) => router.push(`/products?highlight=${id}`)}
              />
              </div>
            </AdminMotionItem>
          )}

          <AdminMotionItem>
            <div ref={recentTxRef}>
            <RecentTransactionsPanel transactions={summary.recentTransactions} formatForDisplay={formatForDisplay} />
            </div>
          </AdminMotionItem>
        </AdminMotionStagger>
    </div>
  );
}

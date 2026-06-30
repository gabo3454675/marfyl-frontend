'use client';

import { useRouter } from 'next/navigation';
import { ExternalLink, ListTodo, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminPanel } from '@/components/admin/admin-panel';
import { cn } from '@/lib/utils';
import type { PendingTask } from './types';

function daysUntilDue(dueDate?: string | null): string | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (diff < 0) return `Vencida hace ${Math.abs(diff)} día${Math.abs(diff) === 1 ? '' : 's'}`;
  if (diff === 0) return 'Vence hoy';
  if (diff === 1) return 'Vence mañana';
  return `Vence en ${diff} días`;
}

function inferDueFromTask(task: PendingTask): string | null {
  if (task.dueDate) return daysUntilDue(task.dueDate);
  const title = task.title.toLowerCase();
  const desc = (task.description ?? '').toLowerCase();
  const isCobranza =
    title.includes('cobr') ||
    title.includes('pagar') ||
    title.includes('cxc') ||
    desc.includes('venc');
  if (isCobranza || task.invoice) {
    const created = new Date(task.createdAt);
    created.setDate(created.getDate() + 7);
    return daysUntilDue(created.toISOString());
  }
  return null;
}

interface PendingTasksPanelProps {
  tasks: PendingTask[];
  loading: boolean;
  taskCategoryFilter: string;
  onFilterChange: (filter: string) => void;
}

export function PendingTasksPanel({
  tasks,
  loading,
  taskCategoryFilter,
  onFilterChange,
}: PendingTasksPanelProps) {
  const router = useRouter();

  return (
    <AdminPanel className="mb-2 md:mb-4">
      <div className="p-4 sm:p-6">
        <div className="mb-4 sm:mb-5">
          <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
            <ListTodo className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="min-w-0">Mis Tareas Pendientes</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Cuentas por pagar/cobrar y tareas asignadas a ti
          </p>
          <div className="flex flex-wrap gap-2 pt-3">
            <Button
              variant={taskCategoryFilter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange('')}
            >
              Todas
            </Button>
            <Button
              variant={taskCategoryFilter === 'COBRANZA' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange('COBRANZA')}
            >
              Cobranza
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No tienes tareas pendientes</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const dueLabel = inferDueFromTask(task);
              const isUrgent = dueLabel?.includes('Vencida') || dueLabel === 'Vence hoy';

              return (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-transparent hover:border-border/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground text-sm sm:text-base break-words">{task.title}</p>
                      {dueLabel && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] shrink-0',
                            isUrgent
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                          )}
                        >
                          {dueLabel}
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 truncate">
                      Asignada por {task.createdBy?.fullName || task.createdBy?.email} • {task.organization?.nombre}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    {task.invoice && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/invoices?highlight=${task.invoice?.id}`)}
                        className="text-xs shrink-0"
                      >
                        <ExternalLink className="h-3 w-3 mr-1 shrink-0" />
                        Ver factura #{task.invoice.id}
                      </Button>
                    )}
                    <Badge
                      variant={task.status === 'IN_PROGRESS' ? 'default' : 'secondary'}
                      className="text-xs shrink-0"
                    >
                      {task.status === 'PENDING'
                        ? 'Pendiente'
                        : task.status === 'IN_PROGRESS'
                          ? 'En progreso'
                          : task.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminPanel>
  );
}

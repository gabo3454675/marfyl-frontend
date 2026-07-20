'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, Lightbulb, Package, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  DashboardDiagnosis,
  DashboardHealth,
  DashboardStrategy,
  DashboardSummary,
} from './types';

export type AttentionItem = {
  id: string;
  tone: 'alert' | 'info' | 'ok';
  title: string;
  href: string;
  cta: string;
};

interface AttentionStripProps {
  summary: DashboardSummary;
  health: DashboardHealth;
  diagnosis: DashboardDiagnosis;
  strategy: DashboardStrategy;
  pendingTasksCount: number;
  canViewFinancialCharts: boolean;
}

export function buildAttentionItems({
  summary,
  health,
  diagnosis,
  strategy,
  pendingTasksCount,
  canViewFinancialCharts,
}: AttentionStripProps): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (summary.lowStockCount > 0) {
    items.push({
      id: 'low-stock',
      tone: 'alert',
      title: `${summary.lowStockCount} producto${summary.lowStockCount === 1 ? '' : 's'} con stock bajo`,
      href: '/alertas-stock',
      cta: 'Revisar',
    });
  }

  if (pendingTasksCount > 0) {
    items.push({
      id: 'tasks',
      tone: 'info',
      title: `${pendingTasksCount} tarea${pendingTasksCount === 1 ? '' : 's'} pendiente${pendingTasksCount === 1 ? '' : 's'}`,
      href: '#tareas-pendientes',
      cta: 'Ver',
    });
  }

  if (canViewFinancialCharts) {
    const criticalMargins = diagnosis.marginErosion?.filter((p) => p.marginCritical) ?? [];
    if (criticalMargins.length > 0) {
      items.push({
        id: 'margin',
        tone: 'alert',
        title: `${criticalMargins.length} producto${criticalMargins.length === 1 ? '' : 's'} con margen crítico`,
        href: '/products',
        cta: 'Revisar',
      });
    }

    const friction = strategy.frictionFunnel?.mensajeAlerta;
    if (friction) {
      items.push({
        id: 'friction',
        tone: 'alert',
        title: friction,
        href: '/credits',
        cta: 'Cobrar',
      });
    }

    const insight = strategy.insights?.[0];
    if (items.length === 0 && insight?.texto) {
      items.push({
        id: 'insight',
        tone: 'info',
        title: insight.texto,
        href: '/assistant',
        cta: 'Explorar',
      });
    }
  }

  if (items.length === 0) {
    const goal =
      health.dailySalesGoal > 0
        ? health.dailySalesGoal
        : Math.max(summary.totalSalesToday, 1);
    const pct = Math.round((summary.totalSalesToday / goal) * 100);
    items.push({
      id: 'ok',
      tone: 'ok',
      title:
        pct >= 100
          ? 'Meta diaria alcanzada. Buen ritmo operativo.'
          : 'Sin alertas críticas. El negocio marcha en orden.',
      href: '/pos',
      cta: 'POS',
    });
  }

  return items.slice(0, 4);
}

const toneIcon = {
  alert: AlertTriangle,
  info: Lightbulb,
  ok: Package,
} as const;

const toneStyles = {
  alert: {
    card: 'border-amber-500/20 bg-gradient-to-br from-amber-500/[0.12] to-transparent hover:border-amber-400/35',
    rail: 'bg-amber-400',
    icon: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/20',
  },
  info: {
    card: 'border-primary/20 bg-gradient-to-br from-primary/[0.1] to-transparent hover:border-primary/40',
    rail: 'bg-primary',
    icon: 'bg-primary/15 text-primary ring-primary/25',
  },
  ok: {
    card: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.1] to-transparent hover:border-emerald-400/35',
    rail: 'bg-emerald-400',
    icon: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20',
  },
} as const;

export function AttentionStrip(props: AttentionStripProps) {
  const items = buildAttentionItems(props);

  return (
    <section aria-label="Atención" className="admin-attention-strip space-y-2.5">
      <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Atención
      </p>
      <ul className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2">
        {items.map((item) => {
          const Icon =
            item.id === 'tasks'
              ? ListTodo
              : item.id === 'low-stock'
                ? Package
                : toneIcon[item.tone];
          const styles = toneStyles[item.tone];
          return (
            <li key={item.id} className="min-w-0">
              <Link
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 overflow-hidden rounded-2xl border',
                  'min-h-[52px] pl-3.5 pr-3.5 py-3 sm:pl-4 sm:pr-4',
                  'transition-all duration-200 touch-manipulation',
                  'active:scale-[0.99]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  'shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]',
                  styles.card,
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-y-2.5 left-0 w-[3px] rounded-full opacity-90',
                    styles.rail,
                  )}
                />
                <span
                  className={cn(
                    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1',
                    styles.icon,
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-[13px] sm:text-sm leading-snug font-medium text-foreground/95 line-clamp-2">
                  {item.title}
                </span>
                <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] sm:text-xs font-semibold text-primary">
                  {item.cta}
                  <ArrowRight className="hidden min-[360px]:inline h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

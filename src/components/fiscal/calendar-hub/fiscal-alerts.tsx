'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Bell, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FiscalCalendarHubViewModel } from '@/types/fiscal-calendar-hub';
import { FiscalHubCard, FiscalHubSectionTitle } from './fiscal-hub-card';
import { SeverityBadge } from './severity-badge';
import { cn } from '@/lib/utils';

export function FiscalAlerts({ data }: { data: FiscalCalendarHubViewModel }) {
  const alerts = data.alerts;

  return (
    <FiscalHubCard delay={0.16}>
      <FiscalHubSectionTitle
        title="Alertas activas"
        description="Problemas detectados, riesgo y acción recomendada en lenguaje claro."
        action={
          alerts.length > 0 ? (
            <span className="text-xs font-medium text-muted-foreground">{alerts.length} activas</span>
          ) : null
        }
      />

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
          <p className="font-medium text-sm">Sin alertas críticas</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            El período no muestra bloqueos urgentes. Siga monitoreando vencimientos.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a, i) => (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'rounded-xl border p-4 transition-shadow hover:shadow-md',
                a.severity === 'critical' && 'border-red-500/30 bg-red-500/5',
                a.severity === 'warning' && 'border-amber-500/30 bg-amber-500/5',
                a.severity === 'info' && 'border-sky-500/25 bg-sky-500/5',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="font-semibold text-sm">{a.title}</p>
                </div>
                <SeverityBadge severity={a.severity} />
              </div>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Problema</dt>
                  <dd className="text-foreground/90 mt-0.5">{a.problem}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Riesgo</dt>
                  <dd className="text-muted-foreground mt-0.5">{a.risk}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Acción</dt>
                  <dd className="text-foreground font-medium mt-0.5">{a.action}</dd>
                </div>
                {a.ruleCode && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Regla</dt>
                    <dd className="font-mono text-xs text-muted-foreground mt-0.5">{a.ruleCode}</dd>
                  </div>
                )}
              </dl>
              {a.blocksOperation && (
                <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                  Esta alerta puede bloquear operaciones hasta resolverse.
                </p>
              )}
              {a.actionHref && (
                <Button variant="link" size="sm" className="px-0 mt-2 h-auto" asChild>
                  <Link href={a.actionHref}>
                    Ir a resolver
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              )}
            </motion.li>
          ))}
        </ul>
      )}
    </FiscalHubCard>
  );
}

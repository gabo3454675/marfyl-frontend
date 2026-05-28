'use client';

import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CalendarClock, Settings2, ShieldAlert } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { FiscalCalendarHubViewModel } from '@/types/fiscal-calendar-hub';
import { FiscalHubCard } from './fiscal-hub-card';
import { cn } from '@/lib/utils';

const healthConfig = {
  healthy: {
    label: 'Saludable',
    color: '#34d399',
    glow: 'shadow-emerald-500/20',
    ring: 'border-emerald-500/40',
  },
  attention: {
    label: 'Requiere atención',
    color: '#fbbf24',
    glow: 'shadow-amber-500/20',
    ring: 'border-amber-500/40',
  },
  critical: {
    label: 'Riesgo alto',
    color: '#f87171',
    glow: 'shadow-red-500/20',
    ring: 'border-red-500/40',
  },
};

function MetricTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  tone?: 'default' | 'warn' | 'danger';
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 bg-muted/25 px-4 py-3 dark:bg-slate-800/40',
        tone === 'warn' && 'border-amber-500/25',
        tone === 'danger' && 'border-red-500/25',
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p
        className={cn(
          'text-2xl font-bold tabular-nums',
          tone === 'danger' && 'text-red-500 dark:text-red-400',
          tone === 'warn' && 'text-amber-600 dark:text-amber-400',
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function FiscalHealthSummary({ data }: { data: FiscalCalendarHubViewModel }) {
  const cfg = healthConfig[data.health.status];
  const chartData = [
    { name: 'score', value: data.health.score },
    { name: 'rest', value: 100 - data.health.score },
  ];

  return (
    <FiscalHubCard delay={0.05} className={cn('relative overflow-hidden', cfg.glow)}>
      <div className="absolute inset-0 fiscal-hub-mesh pointer-events-none" aria-hidden />
      <div className="relative grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4">
          <div
            className={cn(
              'relative h-28 w-28 rounded-full border-4 flex items-center justify-center',
              cfg.ring,
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  innerRadius={38}
                  outerRadius={52}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  <Cell fill={cfg.color} />
                  <Cell fill="hsl(var(--muted))" opacity={0.35} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums">{data.health.score}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">índice</span>
            </div>
          </div>
          <div className="text-center lg:text-left">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Salud fiscal</p>
            <motion.p
              key={data.health.status}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </motion.p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {data.health.status === 'healthy'
                ? 'Cumplimiento estable. Mantenga libros y perfil al día.'
                : data.health.status === 'attention'
                  ? 'Hay vencimientos próximos o datos por revisar.'
                  : 'Acción inmediata: vencimientos o configuración crítica.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricTile icon={CalendarClock} label="Próximas" value={data.health.upcoming} />
          <MetricTile
            icon={ShieldAlert}
            label="Vencidas"
            value={data.health.overdue}
            tone={data.health.overdue > 0 ? 'danger' : 'default'}
          />
          <MetricTile
            icon={Settings2}
            label="Config. faltante"
            value={data.health.missingConfig}
            tone={data.health.missingConfig > 0 ? 'warn' : 'default'}
          />
          <MetricTile
            icon={AlertTriangle}
            label="Alertas críticas"
            value={data.health.criticalAlerts}
            tone={data.health.criticalAlerts > 0 ? 'danger' : 'default'}
          />
        </div>
      </div>
    </FiscalHubCard>
  );
}

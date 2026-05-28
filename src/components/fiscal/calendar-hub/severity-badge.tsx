'use client';

import { cn } from '@/lib/utils';
import type { AlertSeverity, ComplianceLevel } from '@/types/fiscal-calendar-hub';
import { complianceLabel, severityLabel } from '@/lib/fiscal/calendar-hub-mapper';

const severityStyles: Record<AlertSeverity, string> = {
  info: 'bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-300',
  warning: 'bg-amber-500/15 text-amber-800 border-amber-500/35 dark:text-amber-200',
  critical: 'bg-red-500/15 text-red-800 border-red-500/35 dark:text-red-200',
};

const complianceStyles: Record<ComplianceLevel, string> = {
  GREEN: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
  YELLOW: 'bg-amber-500/15 text-amber-800 border-amber-500/35 dark:text-amber-200',
  RED: 'bg-red-500/15 text-red-800 border-red-500/35 dark:text-red-200',
  CLOSED: 'bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-300',
};

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        severityStyles[severity],
      )}
    >
      {severityLabel(severity)}
    </span>
  );
}

export function ComplianceBadge({ compliance }: { compliance: ComplianceLevel }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        complianceStyles[compliance],
      )}
    >
      {complianceLabel(compliance)}
    </span>
  );
}

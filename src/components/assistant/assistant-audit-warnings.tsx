'use client';

import { AlertTriangle, ShieldAlert } from 'lucide-react';
import type { AuditWarning } from '@/lib/api/assistant';
import { cn } from '@/lib/utils';

const SEVERITY_STYLES: Record<
  AuditWarning['severity'],
  { border: string; bg: string; badge: string; icon: string }
> = {
  critical: {
    border: 'border-red-400/40',
    bg: 'bg-red-950/45',
    badge: 'bg-red-500/20 text-red-200',
    icon: 'text-red-300',
  },
  high: {
    border: 'border-amber-400/35',
    bg: 'bg-amber-950/40',
    badge: 'bg-amber-500/20 text-amber-100',
    icon: 'text-amber-300',
  },
  medium: {
    border: 'border-sky-400/30',
    bg: 'bg-sky-950/35',
    badge: 'bg-sky-500/20 text-sky-100',
    icon: 'text-sky-300',
  },
};

const SEVERITY_LABEL: Record<AuditWarning['severity'], string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
};

export function AssistantAuditWarnings({ warnings }: { warnings: AuditWarning[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2" role="status" aria-label="Alertas del auditor preventivo">
      <div className="flex items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-white/50">
        <ShieldAlert className="h-3.5 w-3.5 text-[hsl(var(--dm-b-accent))]" />
        Auditor preventivo
      </div>
      {warnings.map((w) => {
        const style = SEVERITY_STYLES[w.severity];
        return (
          <div
            key={w.code}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-sm shadow-sm backdrop-blur-sm',
              style.border,
              style.bg,
            )}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className={cn('mt-0.5 h-4 w-4 shrink-0', style.icon)} />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-white">{w.title}</p>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                      style.badge,
                    )}
                  >
                    {SEVERITY_LABEL[w.severity]}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-white/80">{w.message}</p>
                {w.accionMarfyl && (
                  <p className="text-xs text-white/60">
                    <span className="font-medium text-white/75">En MARFYL:</span> {w.accionMarfyl}
                  </p>
                )}
                {w.referenciaLegal && (
                  <p className="text-[11px] text-white/45">{w.referenciaLegal}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

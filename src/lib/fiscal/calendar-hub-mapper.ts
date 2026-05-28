import type {
  AlertSeverity,
  CalendarApiDeadline,
  CalendarApiResponse,
  ComplianceHubApiResponse,
  ComplianceLevel,
  FiscalAlertItem,
  FiscalCalendarHubViewModel,
  FiscalHealthStatus,
  FiscalHistoryEvent,
  FiscalObligationRow,
  FiscalProfileSnapshot,
} from '@/types/fiscal-calendar-hub';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function daysUntil(dueDate: string): number {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
}

function obligationAction(code: string, compliance: ComplianceLevel): { label: string; href: string } {
  if (code.startsWith('IVA')) return { label: 'Ir a libro de ventas', href: '/fiscal/libro-ventas' };
  if (code.includes('RETENCION')) return { label: 'Ver retenciones', href: '/fiscal/retenciones' };
  if (code.includes('ISLR')) return { label: 'Pre-declaración', href: '/fiscal/predeclaracion' };
  if (compliance === 'RED') return { label: 'Revisar ahora', href: '/fiscal' };
  return { label: 'Ver panel fiscal', href: '/fiscal' };
}

function mapObligation(d: CalendarApiDeadline): FiscalObligationRow {
  const compliance = (d.compliance as ComplianceLevel) || 'RED';
  const daysLeft = daysUntil(d.dueDate);
  const action = obligationAction(d.template.code, compliance);
  return {
    id: d.id,
    code: d.template.code,
    name: d.template.name,
    dueDate: d.dueDate,
    daysLeft,
    compliance,
    periodicity: d.template.periodicity,
    actionLabel: action.label,
    actionHref: action.href,
  };
}

function buildAlerts(
  obligations: FiscalObligationRow[],
  profile: FiscalProfileSnapshot,
  rifDigit: number | null,
): FiscalAlertItem[] {
  const alerts: FiscalAlertItem[] = [];

  if (!profile.configured) {
    alerts.push({
      id: 'cfg-rif',
      severity: 'critical',
      title: 'Perfil fiscal incompleto',
      problem: 'No hay RIF o razón social configurados para calcular vencimientos SENIAT.',
      risk: 'El calendario no puede asignar terminaciones ni obligaciones correctas.',
      action: 'Completar perfil fiscal',
      actionHref: '/fiscal/perfil',
    });
  }

  if (rifDigit == null && profile.taxId) {
    alerts.push({
      id: 'cfg-digit',
      severity: 'warning',
      title: 'Terminación de RIF no detectada',
      problem: 'El RIF no permite calcular el dígito de terminación para IVA ordinario.',
      risk: 'Las fechas de vencimiento pueden ser incorrectas.',
      action: 'Validar formato de RIF',
      actionHref: '/fiscal/perfil',
    });
  }

  for (const o of obligations) {
    if (o.compliance === 'RED' || o.daysLeft < 0) {
      alerts.push({
        id: `obl-${o.id}-overdue`,
        severity: 'critical',
        title: `${o.name} — atención urgente`,
        problem:
          o.daysLeft < 0
            ? `Venció hace ${Math.abs(o.daysLeft)} día(s) (${new Date(o.dueDate).toLocaleDateString('es-VE')}).`
            : `Estado crítico de cumplimiento para el período actual.`,
        risk: 'Multas, recargos o inhabilitación según normativa SENIAT.',
        action: o.actionLabel,
        actionHref: o.actionHref,
      });
    } else if (o.compliance === 'YELLOW' || (o.daysLeft >= 0 && o.daysLeft <= 7)) {
      alerts.push({
        id: `obl-${o.id}-soon`,
        severity: 'warning',
        title: `${o.name} — por vencer`,
        problem:
          o.daysLeft <= 7
            ? `Vence en ${o.daysLeft === 0 ? 'hoy' : `${o.daysLeft} días`}.`
            : 'Hay inconsistencias en libros o datos del período.',
        risk: 'Riesgo de declaración incompleta o fuera de plazo.',
        action: o.actionLabel,
        actionHref: o.actionHref,
      });
    }
  }

  const seen = new Set<string>();
  return alerts.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

function computeHealth(
  obligations: FiscalObligationRow[],
  alerts: FiscalAlertItem[],
  profile: FiscalProfileSnapshot,
): FiscalCalendarHubViewModel['health'] {
  const overdue = obligations.filter((o) => o.daysLeft < 0 || o.compliance === 'RED').length;
  const upcoming = obligations.filter((o) => o.daysLeft >= 0 && o.daysLeft <= 14).length;
  const missingConfig = profile.configured ? 0 : 1;
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;

  let status: FiscalHealthStatus = 'healthy';
  if (criticalAlerts > 0 || overdue > 0) status = 'critical';
  else if (alerts.some((a) => a.severity === 'warning') || upcoming > 0) status = 'attention';

  const score = Math.max(
    0,
    100 - overdue * 22 - criticalAlerts * 18 - missingConfig * 25 - upcoming * 4,
  );

  return { status, score, upcoming, overdue, missingConfig, criticalAlerts };
}

export function mapProfileToSnapshot(data: {
  organization?: { taxId?: string | null; legalName?: string | null; isSpecialTaxpayer?: boolean; isFormalTaxpayer?: boolean };
  profile?: {
    taxId?: string | null;
    legalName?: string | null;
    taxpayerType?: string;
    isWithholdingAgent?: boolean;
  } | null;
}): FiscalProfileSnapshot {
  const org = data.organization;
  const p = data.profile;
  const taxId = p?.taxId ?? org?.taxId ?? null;
  const legalName = p?.legalName ?? org?.legalName ?? null;
  return {
    taxId,
    legalName,
    taxpayerType: p?.taxpayerType ?? 'ORDINARIO',
    isWithholdingAgent: p?.isWithholdingAgent ?? false,
    isSpecialTaxpayer: org?.isSpecialTaxpayer ?? false,
    isFormalTaxpayer: org?.isFormalTaxpayer ?? false,
    configured: Boolean(taxId?.trim()),
  };
}

export function buildCalendarHubViewModel(
  cal: CalendarApiResponse,
  profile: FiscalProfileSnapshot,
  opts: { backendOnline: boolean; lastSyncAt: string | null; history: FiscalHistoryEvent[]; fromMock?: boolean },
): FiscalCalendarHubViewModel {
  const obligations = (cal.deadlines ?? []).map(mapObligation).sort((a, b) => a.daysLeft - b.daysLeft);
  const alerts = buildAlerts(obligations, profile, cal.rifDigit);
  const health = computeHealth(obligations, alerts, profile);

  return {
    year: cal.year,
    month: cal.month,
    rifDigit: cal.rifDigit,
    terminacionIvaDay: cal.terminacionIvaDay,
    seniatVersion: cal.seniatVersion,
    mode: profile.configured ? 'OPERATIONAL' : 'DIAGNOSTIC',
    modeReasons: profile.configured ? [] : ['Complete el perfil fiscal para salir del modo diagnóstico.'],
    health,
    obligations,
    alerts,
    profile,
    backendOnline: opts.backendOnline,
    lastSyncAt: opts.lastSyncAt,
    history: opts.history,
    activeNormsCount: 0,
    fromMock: opts.fromMock ?? false,
  };
}

export function buildHubFromComplianceApi(
  hub: ComplianceHubApiResponse,
  opts: { backendOnline: boolean; history: FiscalHistoryEvent[]; fromMock?: boolean },
): FiscalCalendarHubViewModel {
  const profile: FiscalProfileSnapshot = {
    taxId: hub.identity.taxId,
    legalName: hub.identity.legalName,
    taxpayerType: hub.identity.taxpayerType ?? 'ORDINARIO',
    isWithholdingAgent: hub.identity.isWithholdingAgent,
    isSpecialTaxpayer: hub.identity.isSpecialTaxpayer,
    isFormalTaxpayer: hub.identity.isFormalTaxpayer,
    configured: hub.identity.configured,
  };

  const obligations = (hub.calendar.deadlines ?? [])
    .map(mapObligation)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const alerts: FiscalAlertItem[] = hub.alerts.map((a) => ({
    ...a,
    actionHref: a.actionHref ?? (a.ruleCode === 'PROFILE_COMPLETENESS' ? '/fiscal/perfil' : undefined),
  }));

  return {
    year: hub.calendar.year,
    month: hub.calendar.month,
    rifDigit: hub.calendar.rifDigit,
    terminacionIvaDay: hub.calendar.terminacionIvaDay,
    seniatVersion: hub.seniatVersion ?? hub.calendar.seniatVersion,
    mode: hub.mode,
    modeReasons: hub.modeReasons,
    health: hub.health,
    obligations,
    alerts,
    profile,
    backendOnline: opts.backendOnline,
    lastSyncAt: hub.lastSyncAt ?? opts.history.find((e) => e.type === 'sync')?.at ?? null,
    history: opts.history,
    activeNormsCount: hub.activeNormsCount,
    fromMock: opts.fromMock ?? false,
  };
}

export function periodLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1] ?? month} ${year}`;
}

export function complianceLabel(c: ComplianceLevel): string {
  const map: Record<ComplianceLevel, string> = {
    GREEN: 'Al día',
    YELLOW: 'Revisar',
    RED: 'Crítico',
    CLOSED: 'Cerrado',
  };
  return map[c] ?? c;
}

export function severityLabel(s: AlertSeverity): string {
  const map: Record<AlertSeverity, string> = {
    info: 'Info',
    warning: 'Atención',
    critical: 'Crítico',
  };
  return map[s];
}

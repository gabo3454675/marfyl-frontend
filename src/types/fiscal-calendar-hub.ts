export type AlertSeverity = 'info' | 'warning' | 'critical';

export type FiscalComplianceMode = 'DIAGNOSTIC' | 'OPERATIONAL';

export type ComplianceLevel = 'GREEN' | 'YELLOW' | 'RED' | 'CLOSED';

export type FiscalHealthStatus = 'healthy' | 'attention' | 'critical';

export interface FiscalObligationRow {
  id: number;
  code: string;
  name: string;
  dueDate: string;
  daysLeft: number;
  compliance: ComplianceLevel;
  periodicity?: string;
  actionLabel: string;
  actionHref: string;
}

export interface FiscalAlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  problem: string;
  risk: string;
  action: string;
  actionHref?: string;
  ruleCode?: string;
  blocksOperation?: boolean;
  source?: 'persisted' | 'computed';
}

export interface FiscalProfileSnapshot {
  taxId: string | null;
  legalName: string | null;
  taxpayerType: string;
  isWithholdingAgent: boolean;
  isSpecialTaxpayer: boolean;
  isFormalTaxpayer: boolean;
  configured: boolean;
}

export interface FiscalHistoryEvent {
  id: string;
  at: string;
  type: 'sync' | 'rules' | 'compliance' | 'config';
  label: string;
  detail?: string;
}

export interface FiscalHealthMetrics {
  status: FiscalHealthStatus;
  score: number;
  upcoming: number;
  overdue: number;
  missingConfig: number;
  criticalAlerts: number;
}

export interface FiscalCalendarHubViewModel {
  year: number;
  month: number;
  rifDigit: number | null;
  terminacionIvaDay: number | null;
  seniatVersion: string | null;
  mode: FiscalComplianceMode;
  modeReasons: string[];
  health: FiscalHealthMetrics;
  obligations: FiscalObligationRow[];
  alerts: FiscalAlertItem[];
  profile: FiscalProfileSnapshot;
  backendOnline: boolean;
  lastSyncAt: string | null;
  history: FiscalHistoryEvent[];
  activeNormsCount: number;
  fromMock: boolean;
}

export interface ComplianceHubApiResponse {
  mode: FiscalComplianceMode;
  modeReasons: string[];
  missingProfileFields: string[];
  calendar: CalendarApiResponse;
  alerts: FiscalAlertItem[];
  health: FiscalHealthMetrics;
  identity: {
    taxId: string | null;
    legalName: string | null;
    taxpayerType: string | null;
    isWithholdingAgent: boolean;
    isSpecialTaxpayer: boolean;
    isFormalTaxpayer: boolean;
    economicActivity: string | null;
    configured: boolean;
  };
  lastSyncAt: string | null;
  seniatVersion: string | null;
  activeNormsCount: number;
  auditRecent: { id: number; action: string; entityType: string; ruleCode?: string | null; at: string }[];
  eventsRecent: { id: number; eventType: string; entityType?: string | null; at: string }[];
}

export interface CalendarApiDeadline {
  id: number;
  dueDate: string;
  compliance: string;
  template: { code: string; name: string; periodicity?: string };
}

export interface CalendarApiResponse {
  year: number;
  month: number;
  rifDigit: number | null;
  terminacionIvaDay: number | null;
  seniatVersion: string | null;
  deadlines: CalendarApiDeadline[];
}

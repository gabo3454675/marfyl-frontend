import type { CalendarApiResponse, FiscalHistoryEvent, FiscalProfileSnapshot } from '@/types/fiscal-calendar-hub';
import { buildCalendarHubViewModel } from './calendar-hub-mapper';

const now = new Date();

function isoDaysFromNow(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function mockCalendarApi(year: number, month: number): CalendarApiResponse {
  return {
    year,
    month,
    rifDigit: 4,
    terminacionIvaDay: 14,
    seniatVersion: '2025.1-demo',
    deadlines: [
      {
        id: 1,
        dueDate: isoDaysFromNow(3),
        compliance: 'YELLOW',
        template: { code: 'IVA_ORDINARIO', name: 'Declaración IVA mensual', periodicity: 'MENSUAL' },
      },
      {
        id: 2,
        dueDate: isoDaysFromNow(12),
        compliance: 'GREEN',
        template: { code: 'RETENCIONES_IVA', name: 'Retenciones IVA', periodicity: 'MENSUAL' },
      },
      {
        id: 3,
        dueDate: isoDaysFromNow(-2),
        compliance: 'RED',
        template: { code: 'IGTF', name: 'IGTF — declaración', periodicity: 'MENSUAL' },
      },
    ],
  };
}

export function mockEmptyCalendar(year: number, month: number): CalendarApiResponse {
  return {
    year,
    month,
    rifDigit: null,
    terminacionIvaDay: null,
    seniatVersion: null,
    deadlines: [],
  };
}

export function mockProfileUnconfigured(): FiscalProfileSnapshot {
  return {
    taxId: null,
    legalName: null,
    taxpayerType: 'ORDINARIO',
    isWithholdingAgent: false,
    isSpecialTaxpayer: false,
    isFormalTaxpayer: false,
    configured: false,
  };
}

export function mockHistory(): FiscalHistoryEvent[] {
  return [
    {
      id: 'h1',
      at: new Date(now.getTime() - 86400000 * 2).toISOString(),
      type: 'sync',
      label: 'Sincronización de reglas SENIAT',
      detail: 'Versión 2025.1-demo aplicada',
    },
    {
      id: 'h2',
      at: new Date(now.getTime() - 86400000 * 5).toISOString(),
      type: 'compliance',
      label: 'Recálculo de cumplimiento',
      detail: 'Período actualizado',
    },
  ];
}

export function mockHubViewModel(year: number, month: number, empty = false) {
  const profile = empty
    ? mockProfileUnconfigured()
    : {
        taxId: 'J-12345678-4',
        legalName: 'Demo MARFYL C.A.',
        taxpayerType: 'ORDINARIO',
        isWithholdingAgent: true,
        isSpecialTaxpayer: false,
        isFormalTaxpayer: false,
        configured: true,
      };
  const cal = empty ? mockEmptyCalendar(year, month) : mockCalendarApi(year, month);
  return buildCalendarHubViewModel(cal, profile, {
    backendOnline: false,
    lastSyncAt: null,
    history: mockHistory(),
    fromMock: true,
  });
}

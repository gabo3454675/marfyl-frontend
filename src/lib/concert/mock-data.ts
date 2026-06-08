import type {
  ConcertAdminOrder,
  ConcertAdminOverview,
  ConcertEventPublic,
  ConcertOrderPublicView,
  HoldSeatsResponse,
} from '@/lib/concert/types';
import { CONCERT_DEFAULT_SLUG } from '@/lib/concert/feature';
import { buildSalonMesasFromLayout } from '@/lib/concert/build-salon-seats';

/** Datos demo cuando no hay PostgreSQL (sin login, sin API). */
export const CONCERT_MOCK_ENABLED =
  process.env.NEXT_PUBLIC_CONCERT_MOCK === 'true';

function buildMockEvent(): ConcertEventPublic {
  const { mesas, seats: allSeats } = buildSalonMesasFromLayout();
  const sold = allSeats.filter((s) => s.status === 'SOLD').length;
  const available = allSeats.filter((s) => s.status === 'AVAILABLE').length;

  return {
    slug: CONCERT_DEFAULT_SLUG,
    title: 'Horacio Blanco Acústico en Íntimo — Bodegón Monddy',
    subtitle: 'Vista demo (sin base de datos)',
    venueName: 'Av. Francisco Solano, Chacaíto, Caracas',
    eventStartsAt: new Date('2026-06-15T23:00:00').toISOString(),
    priceUsdStandard: 40,
    priceUsdVip: 70,
    exchangeRate: 40.5,
    bankAccountName: 'Inversiones Hemenegilda S.A',
    bankAccountInfo:
      'Banco del Tesoro · Cuenta 010630707667073012556 · RIF J-405144823 (tipo J) · Tel. 0412-7572592',
    pagoMovilInfo:
      'Pago móvil — Banco del Tesoro · Tel. 0412-7572592 · RIF J-405144823 (tipo J — jurídico) · Titular: Inversiones Hemenegilda S.A',
    cashInstructions: 'Efectivo USD en taquilla.',
    publicNotes: 'Modo demo local. Con Docker: pnpm db:docker && pnpm db:setup',
    paymentMethods: ['CASH_USD', 'PAGO_MOVIL', 'BANK_TRANSFER'],
    stats: { total: 66 + 32, available: available + 32, sold },
    sections: [
      {
        code: 'SALON',
        label: 'Salón de eventos',
        tiers: ['VIP', 'PREFERENCIAL', 'MEDIA', 'GENERAL'],
        mesas,
        seats: allSeats,
      },
      {
        code: 'VIP',
        label: 'Salón VIP',
        tiers: ['VIP'],
        mesas: [
          {
            mesaNumber: 1,
            tierCode: 'VIP_SALON',
            tierLabel: 'Salón VIP',
            priceUsd: 70,
            priceBs: 85,
            seats: [1, 2, 3, 4].map((n, idx) => ({
              id: 100 + idx,
              rowLabel: 'M1',
              seatNumber: n,
              mesaNumber: 1,
              displayNumber: n,
              priceUsd: 70,
              priceBs: 85,
              tierCode: 'VIP',
              tierLabel: 'Silla VIP',
              status: 'AVAILABLE' as const,
            })),
          },
        ],
        seats: [],
      },
    ],
  };
}

export function getMockEvent(): ConcertEventPublic {
  return buildMockEvent();
}

export function getMockOverview(): ConcertAdminOverview {
  return {
    configured: true,
    event: {
      id: 1,
      slug: CONCERT_DEFAULT_SLUG,
      title: 'Horacio Blanco Acústico en Íntimo',
      eventStartsAt: new Date('2026-06-15T23:00:00').toISOString(),
      publicUrl: `/evento/${CONCERT_DEFAULT_SLUG}`,
    },
    stats: {
      available: 82,
      held: 2,
      sold: 14,
      pendingOrders: 3,
      paidOrders: 11,
      totalSeats: 98,
    },
  };
}

export function getMockOrders(): ConcertAdminOrder[] {
  return [
    {
      id: 1,
      status: 'PENDING_PAYMENT',
      paymentMethod: 'PAGO_MOVIL',
      buyerName: 'María González',
      buyerIdDocument: 'V-12345678',
      buyerPhone: '04141234567',
      buyerEmail: 'maria@ejemplo.com',
      amountUsd: 110,
      amountBs: 130,
      paymentReference: '123456789',
      paymentProofUrl: 'https://placehold.co/320x640/1a1a1a/e8a87c?text=Comprobante+demo',
      publicToken: 'demo-pending-token',
      createdAt: new Date().toISOString(),
      tickets: [
        { id: 1, seatLabel: 'Mesa 3 · Asiento 1', sectionCode: 'SALON', checkedInAt: null },
        { id: 2, seatLabel: 'Mesa 3 · Asiento 2', sectionCode: 'SALON', checkedInAt: null },
      ],
    },
    {
      id: 2,
      status: 'PAID',
      paymentMethod: 'BANK_TRANSFER',
      buyerName: 'Carlos Pérez',
      buyerIdDocument: 'V-87654321',
      buyerPhone: '04241234567',
      amountUsd: 60,
      amountBs: 70,
      paymentReference: '99887766',
      publicToken: 'demo-paid-token',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      paidAt: new Date().toISOString(),
      tickets: [
        { id: 3, seatLabel: 'Mesa 4 · Asiento 3', sectionCode: 'SALON', checkedInAt: null },
      ],
    },
  ];
}

export function mockHold(seatIds: number[]): HoldSeatsResponse {
  const event = buildMockEvent();
  const seats = event.sections.flatMap((s) => s.seats).filter((s) => seatIds.includes(s.id));
  const amountUsd = seats.reduce((a, s) => a + (s.priceUsd ?? 0), 0);
  const amountBs = seats.reduce((a, s) => a + (s.priceBs ?? 0), 0);
  return {
    holdToken: 'demo-hold-token',
    heldUntil: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
    seatIds,
    amountUsd,
    amountBs,
    exchangeRate: event.exchangeRate,
  };
}

export function getMockOrder(token: string): ConcertOrderPublicView {
  if (token === 'demo-paid-token') {
    return {
      id: 1,
      status: 'PAID',
      paid: true,
      buyerName: 'Carlos Pérez',
      amountUsd: 60,
      amountBs: 70,
      event: {
        title: 'Horacio Blanco Acústico en Íntimo',
        venueName: 'Bodegón Monddy',
        eventStartsAt: new Date('2026-06-15T23:00:00').toISOString(),
      },
      tickets: [
        {
          publicToken: 't1',
          seatLabel: 'Mesa 4 · Asiento 3',
          sectionCode: 'SALON',
          qrPayload: 'MARFYL-TKT-DEMO-0001',
          checkedIn: false,
        },
      ],
    };
  }
  return {
    id: 2,
    status: 'PENDING_PAYMENT',
    paid: false,
    buyerName: 'María González',
    amountUsd: 110,
    amountBs: 130,
    paymentMethod: 'PAGO_MOVIL',
    paymentReference: '123456789',
    message: 'Pago en revisión (demo)',
    event: {
      title: 'Horacio Blanco Acústico en Íntimo',
      venueName: 'Bodegón Monddy',
      eventStartsAt: new Date('2026-06-15T23:00:00').toISOString(),
      bankAccountName: 'Inversiones Hemenegilda S.A',
      bankAccountInfo:
        'Banco del Tesoro · Cuenta 010630707667073012556 · RIF J-405144823 · Tel. 0412-7572592',
      pagoMovilInfo:
        'Pago móvil — Banco del Tesoro · Tel. 0412-7572592 · RIF J-405144823 · Titular: Inversiones Hemenegilda S.A',
    },
  };
}

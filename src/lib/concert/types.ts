export type ConcertSeatStatus = 'AVAILABLE' | 'HELD' | 'SOLD';

export type ConcertPaymentMethod = 'CASH_USD' | 'PAGO_MOVIL' | 'BANK_TRANSFER';

export type ConcertOrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED';

export interface ConcertSeatPublic {
  id: number;
  rowLabel: string;
  seatNumber: number;
  mesaNumber?: number | null;
  displayNumber?: number | null;
  priceUsd?: number | null;
  priceBs?: number | null;
  tierCode?: string | null;
  tierLabel?: string | null;
  status: ConcertSeatStatus;
}

export interface ConcertMesaPublic {
  mesaNumber: number;
  tierCode?: string | null;
  tierLabel?: string | null;
  priceUsd?: number | null;
  priceBs?: number | null;
  seats: ConcertSeatPublic[];
}

export interface ConcertSectionPublic {
  code: string;
  label: string;
  tiers?: string[];
  mesas: ConcertMesaPublic[];
  seats: ConcertSeatPublic[];
}

export interface ConcertEventPublic {
  slug: string;
  title: string;
  subtitle?: string | null;
  venueName?: string | null;
  eventStartsAt: string;
  priceUsdStandard: number;
  priceUsdVip: number;
  exchangeRate: number;
  bankAccountName: string;
  bankAccountInfo?: string | null;
  pagoMovilInfo?: string | null;
  cashInstructions?: string | null;
  publicNotes?: string | null;
  paymentMethods: ConcertPaymentMethod[];
  stats: { total: number; available: number; sold: number };
  sections: ConcertSectionPublic[];
}

export interface HoldSeatsResponse {
  holdToken: string;
  heldUntil: string;
  seatIds: number[];
  amountUsd: number;
  amountBs: number;
  exchangeRate: number;
}

export interface CheckoutResponse {
  orderPublicToken: string;
  status: ConcertOrderStatus;
  amountUsd: number;
  amountBs: number;
  message: string;
}

export interface ConcertTicketPublic {
  publicToken: string;
  seatLabel: string;
  sectionCode: string;
  qrPayload: string;
  ticketCode?: string;
  checkedIn: boolean;
}

export interface ConcertTicketScanView {
  valid: boolean;
  status: 'confirmed' | 'used' | 'pending' | 'invalid';
  title: string;
  greeting?: string;
  message: string;
  buyerName?: string;
  ticketCode?: string;
  seatLabel?: string;
  sectionCode?: string;
  checkedInAt?: string;
  event?: {
    title: string;
    headline?: string;
    venueName?: string;
    eventStartsAt?: string;
    entryTimeLabel?: string;
    mainArtist?: string;
    lineup?: string;
  };
}

export interface ConcertOrderPublicView {
  id: number;
  status: ConcertOrderStatus;
  paid: boolean;
  emailSentAt?: string | null;
  buyerName?: string;
  amountUsd?: number;
  amountBs?: number;
  message?: string;
  event?: {
    title: string;
    subtitle?: string | null;
    venueName?: string | null;
    eventStartsAt: string;
  };
  tickets?: ConcertTicketPublic[];
}

export interface ConcertAdminOverview {
  configured: boolean;
  event?: {
    id: number;
    slug: string;
    title: string;
    eventStartsAt: string;
    publicUrl: string;
  };
  stats?: {
    available: number;
    held: number;
    sold: number;
    pendingOrders: number;
    paidOrders: number;
    totalSeats: number;
  };
}

export interface ConcertAdminOrder {
  id: number;
  status: ConcertOrderStatus;
  paymentMethod: ConcertPaymentMethod;
  buyerName: string;
  buyerIdDocument: string;
  buyerPhone: string;
  buyerEmail?: string | null;
  amountUsd: number;
  amountBs: number;
  paymentReference?: string | null;
  paymentProofUrl?: string | null;
  publicToken: string;
  createdAt: string;
  paidAt?: string | null;
  emailSentAt?: string | null;
  tickets: {
    id: number;
    seatLabel: string;
    sectionCode: string;
    checkedInAt?: string | null;
  }[];
}

export interface ScanTicketResult {
  ok: boolean;
  alreadyUsed: boolean;
  checkedInAt?: string | null;
  buyerName: string;
  seatLabel: string;
  sectionCode: string;
  eventTitle?: string;
  message: string;
}

import type { ConcertPaymentMethod, HoldSeatsResponse } from '@/lib/concert/types';

const STORAGE_KEY = 'marfyl-concert-checkout';

export type ConcertCheckoutSession = {
  slug: string;
  hold: HoldSeatsResponse;
  selectedSeatIds: number[];
  step: 'seats' | 'checkout';
  buyerName: string;
  buyerIdDocument: string;
  buyerPhone: string;
  buyerEmail: string;
  paymentMethod: ConcertPaymentMethod;
  paymentReference: string;
  savedAt: string;
};

export function readConcertCheckoutSession(slug: string): ConcertCheckoutSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ConcertCheckoutSession;
    if (data.slug !== slug) return null;
    if (!data.hold?.holdToken || !data.hold?.heldUntil) return null;
    if (new Date(data.hold.heldUntil).getTime() <= Date.now()) {
      clearConcertCheckoutSession();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function writeConcertCheckoutSession(session: ConcertCheckoutSession): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* quota / private mode */
  }
}

export function clearConcertCheckoutSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function patchConcertCheckoutSession(
  slug: string,
  patch: Partial<Omit<ConcertCheckoutSession, 'slug'>>,
): void {
  const current = readConcertCheckoutSession(slug);
  if (!current) return;
  writeConcertCheckoutSession({ ...current, ...patch, slug, savedAt: new Date().toISOString() });
}

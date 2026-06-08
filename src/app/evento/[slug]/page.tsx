'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Ticket, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConcertVenueMap } from '@/components/concert/concert-venue-map';
import { ConcertPaymentDetails } from '@/components/concert/concert-payment-details';
import { SeatMap } from '@/components/concert/seat-map';
import { isConcertFeatureEnabled } from '@/lib/concert/feature';
import type {
  ConcertEventPublic,
  ConcertPaymentMethod,
  ConcertSeatPublic,
  HoldSeatsResponse,
} from '@/lib/concert/types';
import { concertService } from '@/lib/api';
import { getApiErrorMessage, isNetworkFailure } from '@/lib/api/get-error-message';
import { CONCERT_MOCK_ENABLED, getMockEvent, mockHold } from '@/lib/concert/mock-data';
import { CONCERT_TICKET_DISPLAY } from '@/lib/concert/ticket-display.constants';
import { usdToBsForConcert } from '@/lib/concert/pricing';

const PAYMENT_LABELS: Record<ConcertPaymentMethod, string> = {
  CASH_USD: 'Efectivo USD en local',
  PAGO_MOVIL: 'Pago móvil',
  BANK_TRANSFER: 'Transferencia bancaria',
};

export default function ConcertEventPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<ConcertEventPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [hold, setHold] = useState<HoldSeatsResponse | null>(null);
  const [holding, setHolding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'seats' | 'checkout'>('seats');
  const [activeMesa, setActiveMesa] = useState<number | null>(null);

  const [buyerName, setBuyerName] = useState('');
  const [buyerIdDocument, setBuyerIdDocument] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ConcertPaymentMethod>('PAGO_MOVIL');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await concertService.getEvent(slug);
      setEvent(data);
    } catch (err) {
      if (CONCERT_MOCK_ENABLED && isNetworkFailure(err)) {
        setEvent(getMockEvent());
        setError(null);
      } else {
        setError(getApiErrorMessage(err, 'No se pudo cargar el evento'));
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!isConcertFeatureEnabled()) {
      setError('Venta de entradas no disponible');
      setLoading(false);
      return;
    }
    loadEvent();
  }, [loadEvent]);

  const selectedSeats = useMemo(() => {
    if (!event) return [];
    const all: ConcertSeatPublic[] = [];
    for (const sec of event.sections) all.push(...sec.seats);
    return all.filter((s) => selected.has(s.id));
  }, [event, selected]);

  const estimatedUsd = useMemo(
    () =>
      selectedSeats.reduce(
        (sum, seat) => sum + (seat.priceUsd ?? event?.priceUsdStandard ?? 0),
        0,
      ),
    [selectedSeats, event?.priceUsdStandard],
  );

  const estimatedBs = useMemo(
    () =>
      selectedSeats.reduce(
        (sum, seat) =>
          sum +
          usdToBsForConcert(
            seat.priceUsd ?? event?.priceUsdStandard ?? 0,
            event?.exchangeRate ?? 1,
          ),
        0,
      ),
    [selectedSeats, event?.priceUsdStandard, event?.exchangeRate],
  );

  const toggleSeat = (seat: ConcertSeatPublic) => {
    if (seat.status !== 'AVAILABLE') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) next.delete(seat.id);
      else next.add(seat.id);
      return next;
    });
    setHold(null);
  };

  const handleHoldAndCheckout = async () => {
    if (selected.size === 0) return;
    setHolding(true);
    setError(null);
    try {
      const data = await concertService.holdSeats(slug, [...selected]);
      setHold(data);
      setStep('checkout');
    } catch (err) {
      if (CONCERT_MOCK_ENABLED && isNetworkFailure(err)) {
        setHold(mockHold([...selected]));
        setStep('checkout');
      } else {
        setError(getApiErrorMessage(err, 'No se pudieron reservar los asientos'));
        await loadEvent();
      }
    } finally {
      setHolding(false);
    }
  };

  const handleProofFile = (file: File | null) => {
    if (paymentProofPreview) URL.revokeObjectURL(paymentProofPreview);
    setPaymentProofFile(file);
    setPaymentProofPreview(file ? URL.createObjectURL(file) : null);
  };

  const clearProofFile = () => handleProofFile(null);

  useEffect(() => {
    return () => {
      if (paymentProofPreview) URL.revokeObjectURL(paymentProofPreview);
    };
  }, [paymentProofPreview]);

  const handleCheckout = async () => {
    if (!hold) return;
    if (!buyerEmail.trim()) {
      setError('El correo electrónico es obligatorio para recibir sus entradas');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('holdToken', hold.holdToken);
      form.append('buyerName', buyerName.trim());
      form.append('buyerIdDocument', buyerIdDocument.trim());
      form.append('buyerPhone', buyerPhone.trim());
      form.append('buyerEmail', buyerEmail.trim());
      form.append('paymentMethod', paymentMethod);
      if (paymentReference.trim()) form.append('paymentReference', paymentReference.trim());
      if (paymentProofFile) form.append('paymentProof', paymentProofFile);

      const data = await concertService.checkout(slug, form);
      setCheckoutSuccess(true);
      router.push(`/evento/${slug}/entrada/${data.orderPublicToken}`);
    } catch (err) {
      if (CONCERT_MOCK_ENABLED && isNetworkFailure(err)) {
        router.push(`/evento/${slug}/entrada/demo-pending-token`);
      } else {
        setError(getApiErrorMessage(err, 'No se pudo registrar la compra'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConcertFeatureEnabled()) {
    return (
      <div className="concert-shell text-center text-white/70">
        Módulo de entradas desactivado.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="concert-shell flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-teal-300" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="concert-shell text-center">
        <p className="text-red-400">{error}</p>
        <Button className="mt-4" variant="outline" onClick={loadEvent}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!event) return null;

  const salonSection = event.sections.find((s) => s.code === 'SALON');
  const salonSeats = salonSection?.seats ?? [];
  const vipSection = event.sections.find((s) => s.code === 'VIP');

  const needsReference =
    paymentMethod === 'PAGO_MOVIL' || paymentMethod === 'BANK_TRANSFER';

  return (
    <div className="concert-shell pb-32">
      <header className="concert-hero">
        <p className="concert-hero-eyebrow">Venta digital · MARFYL</p>
        <h1 className="concert-hero-title">{CONCERT_TICKET_DISPLAY.mainArtist}</h1>
        <p className="concert-hero-sub">
          {event.subtitle ?? CONCERT_TICKET_DISPLAY.eventHeadline}
        </p>
        <p className="mt-3 text-base font-bold text-teal-300">
          Ingreso {CONCERT_TICKET_DISPLAY.entryTimeLabel}
          {' · '}
          {new Date(event.eventStartsAt).toLocaleString('es-VE', {
            dateStyle: 'full',
            timeStyle: 'short',
            timeZone: 'America/Caracas',
          })}
        </p>
        {event.venueName && (
          <p className="mt-2 text-sm text-white/55">
            {event.venueName} · {event.title || CONCERT_TICKET_DISPLAY.venueLabel}
          </p>
        )}
      </header>

      {event.publicNotes && (
        <p className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          {event.publicNotes}
        </p>
      )}

      {step === 'seats' && (
        <>
          <div className="venue-flow-banner">
            <strong>Compra para el público</strong> — no necesita usuario ni entrar al panel MARFYL.
            Comparta este enlace por WhatsApp o redes. Toque una <strong>mesa (01–20)</strong> en el
            plano, elija asientos libres y complete el pago.
          </div>

          <h2 className="mb-3 text-center text-lg font-semibold">Salón de eventos — plano</h2>
          <p className="mb-4 text-center text-sm text-white/60">
            Elija el <strong>color de zona</strong> (como en el flyer), luego la mesa y sus asientos.
          </p>

          <ConcertVenueMap
            seats={salonSeats}
            exchangeRate={event?.exchangeRate ?? 1}
            mode="buy"
            selectedIds={selected}
            activeMesa={activeMesa}
            onZoneClick={(mesa) => {
              setActiveMesa(mesa);
              document.getElementById('mesa-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }}
            onSeatToggle={toggleSeat}
          />

          {vipSection && (vipSection.mesas?.length ?? 0) > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 text-lg font-semibold">{vipSection.label}</h2>
              <SeatMap
                sectionLabel={vipSection.label}
                mesas={vipSection.mesas ?? []}
                selectedIds={selected}
                onToggle={toggleSeat}
              />
            </div>
          )}
        </>
      )}

      {step === 'checkout' && hold && (
        <div className="mx-auto max-w-lg space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <p className="font-medium">Reserva activa</p>
            <p className="text-white/60">
              Válida hasta{' '}
              {new Date(hold.heldUntil).toLocaleTimeString('es-VE', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="mt-2">
              Total: <strong>USD {hold.amountUsd.toFixed(2)}</strong> · Bs{' '}
              {hold.amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="concert-form-grid">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="buyerName">Nombre completo</Label>
              <Input
                id="buyerName"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="bg-white/5 border-white/15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyerId">Cédula / documento</Label>
              <Input
                id="buyerId"
                value={buyerIdDocument}
                onChange={(e) => setBuyerIdDocument(e.target.value)}
                className="bg-white/5 border-white/15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyerPhone">Teléfono</Label>
              <Input
                id="buyerPhone"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                className="bg-white/5 border-white/15"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="buyerEmail">Correo electrónico *</Label>
              <Input
                id="buyerEmail"
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                className="bg-white/5 border-white/15"
                required
              />
              <p className="text-xs text-white/50">
                Recibirás tus entradas en este correo cuando confirmemos tu pago
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Método de pago</Label>
            {event.paymentMethods.map((m) => (
              <label
                key={m}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 px-4 py-3 has-[:checked]:border-[hsl(var(--dm-a-accent))]"
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === m}
                  onChange={() => setPaymentMethod(m)}
                  className="accent-[hsl(var(--dm-a-accent))]"
                />
                <span className="text-sm">{PAYMENT_LABELS[m]}</span>
              </label>
            ))}
          </div>

          {event.paymentMethods.includes(paymentMethod) && (
            <ConcertPaymentDetails event={event} method={paymentMethod} />
          )}

          {needsReference && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ref">Número de referencia</Label>
                <Input
                  id="ref"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Referencia del pago móvil o transferencia"
                  className="bg-white/5 border-white/15"
                />
              </div>

              <div className="concert-proof-upload">
                <Label>Captura del comprobante (opcional)</Label>
                <p className="text-xs text-white/55">
                  Suba la captura de pantalla del pago móvil o transferencia para que el
                  organizador confirme más rápido.
                </p>
                {paymentProofPreview ? (
                  <div className="relative flex flex-col items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={paymentProofPreview}
                      alt="Vista previa del comprobante"
                      className="concert-proof-preview"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 border-white/20"
                      onClick={clearProofFile}
                    >
                      <X className="h-4 w-4" />
                      Quitar imagen
                    </Button>
                  </div>
                ) : (
                  <label className="concert-proof-upload-label">
                    <Upload className="h-8 w-8 text-[hsl(var(--dm-a-accent))]" aria-hidden />
                    <span className="text-sm font-medium">Toque para subir captura</span>
                    <span className="text-xs text-white/50">JPG, PNG o WebP · máx. 5 MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="sr-only"
                      onChange={(e) => handleProofFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-white/20"
              onClick={() => {
                setStep('seats');
                setHold(null);
              }}
            >
              Volver a asientos
            </Button>
            <Button
              type="button"
              className="flex-1 bg-[hsl(var(--dm-a-accent))] text-[hsl(0_0%_12%)] hover:brightness-105"
              disabled={submitting || !buyerName || !buyerIdDocument || !buyerPhone || !buyerEmail}
              onClick={handleCheckout}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Confirmar compra'
              )}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}

      {checkoutSuccess && (
        <p className="mt-4 text-center text-sm text-green-400">
          Tu orden está pendiente. Recibirás un email cuando el organizador confirme tu pago.
        </p>
      )}

      {step === 'seats' && (
        <div className="concert-checkout-panel">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/60">
                {selected.size} asiento{selected.size !== 1 ? 's' : ''} seleccionado
                {selected.size !== 1 ? 's' : ''}
              </p>
              {selected.size > 0 && (
                <p className="text-lg font-semibold">
                  USD {estimatedUsd.toFixed(2)} · Bs{' '}
                  {estimatedBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
            <Button
              type="button"
              disabled={selected.size === 0 || holding}
              className="gap-2 bg-[hsl(var(--dm-a-accent))] text-[hsl(0_0%_12%)] hover:brightness-105"
              onClick={handleHoldAndCheckout}
            >
              {holding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Ticket className="h-4 w-4" />
                  Continuar al pago
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

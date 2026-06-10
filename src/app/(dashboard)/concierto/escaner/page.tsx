'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef, useState } from 'react';
import { Loader2, ScanLine, XCircle } from 'lucide-react';
import { concertService } from '@/lib/api';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { isConcertFeatureEnabled } from '@/lib/concert/feature';
import { normalizeTicketScanPayload } from '@/lib/concert/parse-ticket-scan';
import type { ScanTicketResult } from '@/lib/concert/types';
import { getApiErrorMessage, isNetworkFailure } from '@/lib/api/get-error-message';
import { CONCERT_MOCK_ENABLED } from '@/lib/concert/mock-data';

const ConcertQrScanner = dynamic(
  () =>
    import('@/components/concert/concert-qr-scanner').then((m) => m.ConcertQrScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[3/4] items-center justify-center rounded-xl border border-border bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

const SCAN_COOLDOWN_MS = 2500;

export default function ConciertoEscanerPage() {
  const [payload, setPayload] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanTicketResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  const submitScan = useCallback(async (raw: string) => {
    const normalized = normalizeTicketScanPayload(raw);
    if (!normalized || !isConcertFeatureEnabled()) return;

    const now = Date.now();
    const last = lastScanRef.current;
    if (
      last &&
      last.code === normalized &&
      now - last.at < SCAN_COOLDOWN_MS
    ) {
      return;
    }
    lastScanRef.current = { code: normalized, at: now };

    setScanning(true);
    setError(null);
    setResult(null);

    if (CONCERT_MOCK_ENABLED && normalized.includes('MARFYL-TKT-DEMO')) {
      setResult({
        ok: true,
        alreadyUsed: false,
        buyerName: 'Carlos Pérez',
        seatLabel: 'Mesa 4 · Asiento 3',
        sectionCode: 'SALON',
        eventTitle: 'Horacio Blanco Acústico en Íntimo',
        message: 'Acceso autorizado (demo)',
      });
      setPayload('');
      setScanning(false);
      return;
    }

    try {
      const res = await concertService.scanTicket(normalized);
      setResult(res);
      setPayload('');
    } catch (err) {
      if (CONCERT_MOCK_ENABLED && isNetworkFailure(err)) {
        setError('Use el código MARFYL-TKT-DEMO-0001 en modo demo');
      } else {
        setError(getApiErrorMessage(err, 'Entrada no válida'));
      }
    } finally {
      setScanning(false);
    }
  }, []);

  const handleCameraScan = useCallback(
    (code: string) => {
      setCameraError(null);
      void submitScan(code);
    },
    [submitScan],
  );

  return (
    <AdminPageShell
      eyebrow="Concierto"
      title="Escáner de acceso"
      subtitle="Valide entradas QR en la puerta del evento. Evita doble ingreso."
    >
      <div className="mx-auto max-w-lg space-y-6">
        <AdminCard>
          <div className="space-y-4 p-2 sm:p-4">
            <ConcertQrScanner
              onScan={handleCameraScan}
              onError={setCameraError}
              disabled={scanning}
            />

            {cameraError && (
              <p className="text-sm text-destructive" role="alert">
                {cameraError}
              </p>
            )}

            <div className="space-y-2 border-t border-border pt-4">
              <Label htmlFor="qr">Código manual (respaldo)</Label>
              <Input
                id="qr"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder="URL del boleto o código MARFYL-TKT-..."
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void submitScan(payload);
                }}
              />
            </div>

            <Button
              className="gap-2"
              disabled={scanning || !payload.trim()}
              onClick={() => void submitScan(payload)}
            >
              {scanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ScanLine className="h-4 w-4" />
              )}
              Validar entrada
            </Button>
          </div>
        </AdminCard>

        {scanning && (
          <p className="text-center text-sm text-muted-foreground">
            Validando entrada…
          </p>
        )}

        {error && (
          <p className="text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {result?.cancelled && (
          <div className="rounded-lg border border-red-500 bg-red-500/20 p-4">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold">Entrada Cancelada</span>
            </div>
            <p className="mt-2 text-sm text-red-300">
              Esta entrada fue cancelada y no es válida para ingreso.
            </p>
            <p className="mt-1 text-sm text-white/70">
              {result.buyerName} - {result.seatLabel}
            </p>
            {result.eventTitle && (
              <p className="mt-1 text-xs text-red-300/60">{result.eventTitle}</p>
            )}
          </div>
        )}

        {result && !result.cancelled && (
          <div
            className={cn(
              'concert-scanner-result',
              result.ok && !result.alreadyUsed && 'concert-scanner-result--ok',
              (!result.ok || result.alreadyUsed) && 'concert-scanner-result--warn',
            )}
          >
            <p className="text-lg font-semibold">{result.message}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {result.buyerName} · {result.sectionCode} {result.seatLabel}
            </p>
            {result.eventTitle && (
              <p className="text-xs text-muted-foreground">{result.eventTitle}</p>
            )}
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
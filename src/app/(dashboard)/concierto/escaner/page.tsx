'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, ScanLine } from 'lucide-react';
import { concertService } from '@/lib/api';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { isConcertFeatureEnabled } from '@/lib/concert/feature';
import type { ScanTicketResult } from '@/lib/concert/types';
import { getApiErrorMessage, isNetworkFailure } from '@/lib/api/get-error-message';
import { CONCERT_MOCK_ENABLED } from '@/lib/concert/mock-data';

export default function ConciertoEscanerPage() {
  const [payload, setPayload] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanTicketResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const submitScan = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || !isConcertFeatureEnabled()) return;
    setScanning(true);
    setError(null);
    setResult(null);
    if (CONCERT_MOCK_ENABLED && trimmed.includes('MARFYL-TKT-DEMO')) {
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
      const res = await concertService.scanTicket(trimmed);
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
  };

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);

      const detectorCtor = (
        window as unknown as {
          BarcodeDetector?: new (opts: { formats: string[] }) => {
            detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
          };
        }
      ).BarcodeDetector;

      if (detectorCtor) {
        const detector = new detectorCtor({ formats: ['qr_code'] });
        const tick = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes[0]?.rawValue) {
              stopCamera();
              await submitScan(codes[0].rawValue);
              return;
            }
          } catch {
            /* ignore frame errors */
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }
    } catch {
      setError('No se pudo acceder a la cámara. Use el campo manual.');
    }
  };

  return (
    <AdminPageShell
      eyebrow="Concierto"
      title="Escáner de acceso"
      subtitle="Valide entradas QR en la puerta del evento. Evita doble ingreso."
    >
      <div className="mx-auto max-w-lg space-y-6">
        <AdminCard>
          <div className="space-y-4 p-2 sm:p-4">
            <div className="space-y-2">
              <Label htmlFor="qr">Código QR o payload</Label>
              <Input
                id="qr"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder="MARFYL-TKT-..."
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitScan(payload);
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="gap-2"
                disabled={scanning || !payload.trim()}
                onClick={() => submitScan(payload)}
              >
                {scanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanLine className="h-4 w-4" />
                )}
                Validar entrada
              </Button>
              {!cameraOn ? (
                <Button type="button" variant="outline" onClick={startCamera}>
                  Usar cámara
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={stopCamera}>
                  Detener cámara
                </Button>
              )}
            </div>
          </div>
        </AdminCard>

        {cameraOn && (
          <div className="overflow-hidden rounded-xl border border-border">
            <video ref={videoRef} className="aspect-video w-full bg-black object-cover" muted playsInline />
            <p className="p-2 text-center text-xs text-muted-foreground">
              Apunte al código QR. Si su navegador no detecta automáticamente, pegue el código arriba.
            </p>
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {result && (
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

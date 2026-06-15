'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  onScan: (value: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
};

const REAR_CAMERA_RE =
  /back|rear|trasera|trás|environment|principal|camera 2|camara 2|wide|gran angular/i;

async function pickRearCameraDeviceId(): Promise<string | undefined> {
  const devices = await BrowserQRCodeReader.listVideoInputDevices();
  if (!devices.length) return undefined;

  const rear = devices.find((d) => REAR_CAMERA_RE.test(d.label));
  if (rear) return rear.deviceId;

  // En muchos Android/iPhone la cámara trasera es la última de la lista.
  if (devices.length > 1) return devices[devices.length - 1].deviceId;
  return devices[0].deviceId;
}

export function ConcertQrScanner({
  onScan,
  onError,
  disabled = false,
  className,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const scannedRef = useRef(false);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);

  const stop = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current = null;
    scannedRef.current = false;
    const video = videoRef.current;
    if (video) {
      const stream = video.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    setActive(false);
    setStarting(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const handleDecode = useCallback(
    (
      result: { getText: () => string } | undefined,
      _err: unknown,
      controls: IScannerControls,
    ) => {
      if (!result || scannedRef.current) return;
      scannedRef.current = true;
      controls.stop();
      controlsRef.current = null;
      setActive(false);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(80);
      }
      onScan(result.getText());
    },
    [onScan],
  );

  const start = useCallback(async () => {
    if (disabled || starting || active) return;
    setStarting(true);
    scannedRef.current = false;

    const video = videoRef.current;
    if (!video) {
      onError?.('No se pudo iniciar el visor de cámara.');
      setStarting(false);
      return;
    }

    try {
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 120,
        delayBetweenScanSuccess: 1500,
      });
      readerRef.current = reader;

      const deviceId = await pickRearCameraDeviceId();
      let controls: IScannerControls;

      try {
        controls = await reader.decodeFromVideoDevice(
          deviceId,
          video,
          handleDecode,
        );
      } catch {
        controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          video,
          handleDecode,
        );
      }

      controlsRef.current = controls;
      setActive(true);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message.includes('Permission')
            ? 'Permiso de cámara denegado. Actívelo en ajustes del navegador.'
            : err.message
          : 'No se pudo acceder a la cámara trasera.';
      onError?.(msg);
      stop();
    } finally {
      setStarting(false);
    }
  }, [active, disabled, handleDecode, onError, starting, stop]);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-black">
        <video
          ref={videoRef}
          className={cn(
            'aspect-[3/4] w-full max-h-[min(55dvh,28rem)] object-contain bg-black',
            'md:aspect-video md:max-h-[min(50dvh,24rem)] md:object-cover',
            !active && !starting && 'hidden',
          )}
          muted
          playsInline
          autoPlay
        />
        {!active && !starting && (
          <div className="flex aspect-[3/4] max-h-[min(55dvh,28rem)] items-center justify-center bg-muted/30 px-4 sm:px-6 md:aspect-video md:max-h-[min(50dvh,24rem)]">
            <p className="text-center text-sm text-muted-foreground">
              Use la cámara <strong>trasera</strong> para escanear el QR de la entrada.
              Funciona en Android e iPhone (Safari/Chrome).
            </p>
          </div>
        )}
        {starting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        {active && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <div className="h-36 w-36 rounded-xl border-2 border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] sm:h-44 sm:w-44 md:h-40 md:w-40" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {!active ? (
          <Button
            type="button"
            onClick={start}
            disabled={disabled || starting}
            className="gap-2"
          >
            {starting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Abriendo cámara…
              </>
            ) : (
              'Escanear con cámara trasera'
            )}
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={stop}>
            Detener cámara
          </Button>
        )}
      </div>
    </div>
  );
}

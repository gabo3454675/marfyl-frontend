'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Share } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { MARFYL_LOGO_ICON } from '@/components/brand/marfyl-logo';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, showIosGuide, install, dismiss } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalled) {
      setVisible(false);
      return;
    }
    if (isInstallable) {
      setVisible(true);
      return;
    }
    if (showIosGuide) {
      setVisible(true);
    }
  }, [isInstallable, isInstalled, showIosGuide]);

  const handleInstall = async () => {
    const ok = await install();
    if (ok) setVisible(false);
  };

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  if (!visible || isInstalled) return null;

  const isIos = showIosGuide && !isInstallable;

  return (
    <div
      className="fixed left-4 right-4 z-[100] bottom-[calc(var(--app-bottom-chrome,0px)+0.75rem)] md:bottom-4 md:left-auto md:right-4 md:w-[26rem] max-md:max-w-lg max-md:mx-auto animate-in slide-in-from-bottom-4 duration-300"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-desc"
    >
      <Card className="border-2 border-primary/40 shadow-xl bg-card/95 backdrop-blur-md">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="shrink-0">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border border-border bg-background shadow-sm overflow-hidden p-1.5">
                <Image
                  src={MARFYL_LOGO_ICON}
                  alt=""
                  width={56}
                  height={56}
                  className="h-full w-full object-contain"
                  aria-hidden
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="pwa-install-title" className="font-bold text-base sm:text-lg tracking-tight">
                Instalar MARFYL
              </h3>
              <p id="pwa-install-desc" className="text-xs sm:text-sm text-muted-foreground mt-1 mb-3 leading-relaxed">
                {isIos
                  ? 'Añade MARFYL a tu pantalla de inicio para abrirla como app, con acceso rápido y pantalla completa.'
                  : 'Instala MARFYL en tu dispositivo para usarla como aplicación nativa, con icono en inicio y pantalla completa.'}
              </p>
              {isIos ? (
                <ol className="text-xs text-muted-foreground space-y-1.5 mb-3 list-decimal list-inside">
                  <li className="flex items-start gap-1.5">
                    <Share className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" aria-hidden />
                    <span>Toca <strong className="text-foreground">Compartir</strong> en Safari</span>
                  </li>
                  <li>
                    Elige <strong className="text-foreground">Añadir a pantalla de inicio</strong>
                  </li>
                  <li>
                    Confirma — verás el logo <strong className="text-foreground">MARFYL</strong>
                  </li>
                </ol>
              ) : null}
              <div className="flex gap-2">
                {!isIos ? (
                  <Button onClick={handleInstall} size="sm" className="flex-1 marketing-cta border-0">
                    <Download className="mr-2 h-4 w-4" />
                    Instalar app
                  </Button>
                ) : (
                  <Button onClick={handleDismiss} size="sm" className="flex-1" variant="secondary">
                    Entendido
                  </Button>
                )}
                <Button onClick={handleDismiss} variant="ghost" size="sm" className="px-2 shrink-0" aria-label="Cerrar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

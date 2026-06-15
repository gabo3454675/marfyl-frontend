'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CONCERT_SUPPORT_WHATSAPP_LABEL,
  buildConcertSupportWhatsAppUrl,
} from '@/lib/concert/support.constants';
import { cn } from '@/lib/utils';

type Props = {
  message?: string;
  variant?: 'banner' | 'inline' | 'button';
  className?: string;
};

export function ConcertSupportLink({ message, variant = 'inline', className }: Props) {
  const href = buildConcertSupportWhatsAppUrl(message);

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50/95',
          className,
        )}
      >
        <p className="font-medium">¿Problemas con tu compra o la reserva?</p>
        <p className="mt-1 text-xs text-emerald-100/75">
          Escríbenos por WhatsApp y te ayudamos a completar el pago sin perder tu lugar.
        </p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
        >
          <MessageCircle className="h-4 w-4" />
          Soporte — {CONCERT_SUPPORT_WHATSAPP_LABEL}
        </a>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <Button asChild variant="outline" className={cn('gap-2', className)}>
        <a href={href} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-4 w-4" />
          Soporte WhatsApp
        </a>
      </Button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline',
        className,
      )}
    >
      <MessageCircle className="h-4 w-4 shrink-0" />
      Soporte WhatsApp
    </a>
  );
}

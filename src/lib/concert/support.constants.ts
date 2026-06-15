/** Soporte boletería — WhatsApp (Gabriel Longa). */
export const CONCERT_SUPPORT_WHATSAPP_URL =
  process.env.NEXT_PUBLIC_CONCERT_SUPPORT_WHATSAPP_URL ??
  'https://wa.me/qr/CXXGWJDUIWSWD1';

export const CONCERT_SUPPORT_WHATSAPP_LABEL = 'Gabriel Longa';

export function buildConcertSupportWhatsAppUrl(message?: string): string {
  if (!message?.trim()) return CONCERT_SUPPORT_WHATSAPP_URL;
  const base = CONCERT_SUPPORT_WHATSAPP_URL;
  if (base.includes('wa.me/qr/')) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}text=${encodeURIComponent(message)}`;
}

/** Normaliza URL, UUID o payload legacy leído por el escáner (igual que el backend). */
export function parseTicketScanInput(raw: string): {
  publicToken?: string;
  qrPayload?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return {};

  const fromUrl = trimmed.match(/\/boleto\/([0-9a-f-]{36})/i);
  if (fromUrl) return { publicToken: fromUrl[1] };

  if (/^[0-9a-f-]{36}$/i.test(trimmed)) {
    return { publicToken: trimmed };
  }

  return { qrPayload: trimmed };
}

/** Valor a enviar al API de escaneo (URL completa o token). */
export function normalizeTicketScanPayload(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const parsed = parseTicketScanInput(trimmed);
  return parsed.publicToken ?? parsed.qrPayload ?? trimmed;
}

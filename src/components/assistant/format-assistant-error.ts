export function formatAssistantError(e: unknown): string {
  const ax = e as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const status = (e as { response?: { status?: number } })?.response?.status;
  const raw = Array.isArray(ax.response?.data?.message)
    ? ax.response?.data?.message.join(' ')
    : ax.response?.data?.message ?? ax.message ?? 'Error de conexión con el asistente.';

  if (status === 401 || raw === 'Unauthorized') {
    return 'Sesión no válida. Recargue la página (F5). En vista previa el backend debe tener DEV_PREVIEW_AUTH=true en :3001.';
  }

  if (raw.includes('404') && /gemini|generative/i.test(raw)) {
    return 'El modelo de IA configurado no está disponible. Reinicie el backend (debe usar gemini-2.0-flash) e intente de nuevo.';
  }
  if (raw.includes('429') || raw.includes('quota')) {
    return 'Límite de uso de Gemini alcanzado. Espere un momento o cambie de modelo en GEMINI_MODEL.';
  }
  if (raw.includes('GEMINI_API_KEY')) {
    return 'Configure GEMINI_API_KEY en backend/.env y reinicie el servidor en el puerto 3001.';
  }
  return raw.length > 280 ? `${raw.slice(0, 280)}…` : raw;
}

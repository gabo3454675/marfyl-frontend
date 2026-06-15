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

  if (raw.includes('404') && /model|groq|gemini/i.test(raw)) {
    return 'El modelo de IA no está disponible. En Render use GROQ_MODEL=llama-3.1-8b-instant y redeploy.';
  }
  if (raw.includes('429') || raw.includes('quota')) {
    return 'Límite de uso de Groq alcanzado. Espere un momento e intente de nuevo.';
  }
  if (
    raw.includes('GROQ_API_KEY') ||
    raw.includes('GEMINI_API_KEY') ||
    /no configurado.*(GROQ|GEMINI|asistente)/i.test(raw)
  ) {
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocal) {
      return 'Configure GROQ_API_KEY en backend/.env y reinicie el servidor en el puerto 3001.';
    }
    return 'Falta GROQ_API_KEY en Render (servicio marfyl-backend → Environment). Guarde, espere el redeploy y recargue la página.';
  }
  return raw.length > 280 ? `${raw.slice(0, 280)}…` : raw;
}

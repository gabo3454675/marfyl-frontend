import { AxiosError } from 'axios';

export function isNetworkFailure(err: unknown): boolean {
  if (err instanceof AxiosError) {
    return !err.response && (err.code === 'ERR_NETWORK' || err.message === 'Network Error');
  }
  if (err instanceof Error) {
    return err.message === 'Network Error' || err.message.includes('Network Error');
  }
  return false;
}

/** Mensaje legible para el usuario (español). */
export function getApiErrorMessage(err: unknown, fallback = 'Error al cargar datos'): string {
  if (isNetworkFailure(err)) {
    return 'No hay conexión con el API. Inicie el backend (puerto 3001) y, si usa datos reales, PostgreSQL con Docker (puerto 5433).';
  }
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join(', ');
    if (err.response?.status === 503) {
      return 'Base de datos no disponible. Ejecute pnpm db:docker y pnpm db:setup en el proyecto.';
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export const PREVIEW_OFFLINE_HINT =
  'Vista previa UI: el diseño funciona sin API. Para datos reales: pnpm dev en la raíz del monorepo y Docker con Postgres en 5433.';

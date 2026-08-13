import type { Organization } from '@/store/useAuthStore';

export function isConcertFeatureEnabled(): boolean {
  // Activo por defecto. Solo se apaga con =false explícito.
  return process.env.NEXT_PUBLIC_FEATURE_CONCERT !== 'false';
}

/** Panel admin de concierto: flag global on y concertModuleEnabled en la org activa. */
export function isConcertAdminEnabledForOrganization(
  org: Pick<Organization, 'slug' | 'concertModuleEnabled'> | null | undefined,
): boolean {
  if (!isConcertFeatureEnabled() || !org) return false;
  return org.concertModuleEnabled === true;
}

export const CONCERT_DEFAULT_SLUG =
  process.env.NEXT_PUBLIC_CONCERT_SLUG || 'hemenegilda-capacidad';

/** Minutos que dura la reserva temporal al ir al checkout (debe coincidir con backend). */
export const CONCERT_HOLD_MINUTES = Number(
  process.env.NEXT_PUBLIC_CONCERT_HOLD_MINUTES ?? 20,
);

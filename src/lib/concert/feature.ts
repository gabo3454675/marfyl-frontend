import type { Organization } from '@/store/useAuthStore';

const CONCERT_ORG_SLUG = 'monddy';

export function isConcertFeatureEnabled(): boolean {
  // Activo por defecto (Monddy en prod). Solo se apaga con =false explícito.
  return process.env.NEXT_PUBLIC_FEATURE_CONCERT !== 'false';
}

/** Panel admin de concierto: solo si el flag global está on y la org activa es Monddy (o tiene concertModuleEnabled). */
export function isConcertAdminEnabledForOrganization(
  org: Pick<Organization, 'slug' | 'concertModuleEnabled'> | null | undefined,
): boolean {
  if (!isConcertFeatureEnabled() || !org) return false;
  if (org.concertModuleEnabled === true) return true;
  return org.slug === CONCERT_ORG_SLUG;
}

export const CONCERT_DEFAULT_SLUG =
  process.env.NEXT_PUBLIC_CONCERT_SLUG || 'hemenegilda-capacidad';

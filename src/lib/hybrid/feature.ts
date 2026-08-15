import { isHybridOrgSlug } from '@/lib/founding-orgs';

function normalizeKey(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export type HybridOrgIdentity = {
  slug?: string | null;
  name?: string | null;
} | null | undefined;

/**
 * Gate de UI Hybrid: orgs fundadoras (Monddy, Davean, El Rancho).
 * Acepta slug o nombre por si la sesión trae Company legacy o un persist sin slug.
 */
export function isHybridEnabledForOrganization(org: HybridOrgIdentity): boolean {
  if (!org) return false;

  const slug = normalizeKey(org.slug);
  if (slug && isHybridOrgSlug(slug)) return true;

  const name = normalizeKey(org.name);
  if (!name) return false;

  // Intentar match por nombre si no hay slug
  const nameSlug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return isHybridOrgSlug(nameSlug);
}

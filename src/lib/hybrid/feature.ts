import { HYBRID_ORG_SLUG } from '@/lib/founding-orgs';

function normalizeKey(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type HybridOrgIdentity = {
  slug?: string | null;
  name?: string | null;
} | null | undefined;

/**
 * Gate de UI Hybrid: solo la org Monddy.
 * Acepta slug (`monddy`) o nombre (`Monddy`, `Monddy Corp`) por si la sesión
 * trae Company legacy o un persist sin slug.
 */
export function isHybridEnabledForOrganization(org: HybridOrgIdentity): boolean {
  if (!org) return false;

  const slug = normalizeKey(org.slug);
  if (slug === HYBRID_ORG_SLUG) return true;
  if (slug.startsWith(`${HYBRID_ORG_SLUG}-`)) return true;

  const name = normalizeKey(org.name);
  if (!name) return false;
  if (name === HYBRID_ORG_SLUG) return true;

  const nameSlug = slugifyName(org.name ?? '');
  return nameSlug === HYBRID_ORG_SLUG || nameSlug.startsWith(`${HYBRID_ORG_SLUG}-`);
}

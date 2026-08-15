import { HYBRID_ORG_SLUG } from '@/lib/founding-orgs';

/** Gate de UI Hybrid: solo la org Monddy (slug === HYBRID_ORG_SLUG). */
export function isHybridEnabledForOrganization(
  org: { slug?: string | null } | null | undefined,
): boolean {
  if (!org?.slug) return false;
  return org.slug === HYBRID_ORG_SLUG;
}

/** Espejo del backend — slugs del grupo fundador. */
export const FOUNDING_ORG_SLUGS = [
  'el-rancho-de-german',
  'monddy',
  'davean',
] as const;

/** Única org con proxy de solo lectura hacia Hybrid (espejo backend). */
export const HYBRID_ORG_SLUG = 'monddy';

/** Org sin cálculo ni cobro de IVA en ventas (precio = total). */
export const IVA_DISABLED_ORG_SLUG = 'el-rancho-de-german';

export function isFoundingOrgSlug(slug: string): boolean {
  return (FOUNDING_ORG_SLUGS as readonly string[]).includes(slug);
}

export function isIvaDisabledOrgSlug(slug: string | null | undefined): boolean {
  return slug === IVA_DISABLED_ORG_SLUG;
}

export function filterOrganizationsForLogin<T extends { slug: string }>(
  organizations: T[],
  isPlatformSuperAdmin: boolean,
): T[] {
  if (isPlatformSuperAdmin) return organizations;
  // Todos los usuarios ven TODAS sus membresías (sin filtrar por founding org)
  return organizations;
}

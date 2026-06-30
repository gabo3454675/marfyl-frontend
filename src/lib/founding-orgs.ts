/** Espejo del backend — slugs del grupo fundador. */
export const FOUNDING_ORG_SLUGS = [
  'el-rancho-de-german',
  'monddy',
  'davean',
] as const;

export function isFoundingOrgSlug(slug: string): boolean {
  return (FOUNDING_ORG_SLUGS as readonly string[]).includes(slug);
}

export function filterOrganizationsForLogin<T extends { slug: string }>(
  organizations: T[],
  isPlatformSuperAdmin: boolean,
): T[] {
  if (isPlatformSuperAdmin) return organizations;
  // Todos los usuarios ven TODAS sus membresías (sin filtrar por founding org)
  return organizations;
}

/**
 * Paletas MARFYL — Blue Horizon (SaaS Redesign)
 *
 * Paleta A (operativo + fiscal): Sky Blue + Deep Navy
 * Paleta B (marketing + asistente IA): Ocean Blue + Dark Slate
 */

/** Default theme for the application. */
export const DEFAULT_THEME = 'light';

export const PALETTE_A = {
  name: 'Operación / Fiscal',
  accent: '#0284C7', // Sky Blue (blue-600)
  base: '#0F172A', // Deep Navy (slate-900)
  accentHsl: '210 100% 56%',
  baseHsl: '213 60% 10%',
} as const;

export const PALETTE_B = {
  name: 'Marketing / Asistente IA',
  accent: '#38BDF8', // Ocean Blue (sky-400)
  base: '#1E293B', // Dark Slate (slate-800)
  accentHsl: '210 90% 60%',
  baseHsl: '215 40% 16%',
} as const;

/**
 * Paletas MARFYL — Dark Materials
 *
 * Paleta A (operativo + fiscal): Cashmere Yellow + Darkmoon Core
 * Paleta B (marketing + asistente IA): Sunset Coral + Black Granite
 */
export const PALETTE_A = {
  name: 'Operación / Fiscal',
  accent: '#FFEE91', // Cashmere Yellow
  base: '#222222', // Darkmoon Core
  accentHsl: '48 100% 78%',
  baseHsl: '0 0% 13%',
} as const;

export const PALETTE_B = {
  name: 'Marketing / Asistente IA',
  accent: '#FFCAB5', // Sunset Coral
  base: '#1E1E1E', // Black Granite
  accentHsl: '22 100% 85%',
  baseHsl: '0 0% 12%',
} as const;

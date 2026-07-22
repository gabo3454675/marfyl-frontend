/**
 * Feature flag para la Galería de Módulos.
 * 
 * Patrón: OPT-IN (desactivado por defecto).
 * Para activar: NEXT_PUBLIC_FEATURE_MODULE_GALLERY=true
 * 
 * Diferencia con concierto (opt-out): La galería es nueva y debe
 * probarse antes de activarse en producción.
 */
export function isModuleGalleryEnabled(): boolean {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FEATURE_MODULE_GALLERY === 'true') {
    return true;
  }
  return false;
}

/** Detección de vista previa fiscal usable en middleware (sin `window`). */
export function isFiscalPreviewModeServer(): boolean {
  if (process.env.NEXT_PUBLIC_FISCAL_PREVIEW === 'true') return true;
  if (process.env.NEXT_PUBLIC_FISCAL_PREVIEW === 'false') return false;
  return process.env.NODE_ENV === 'development';
}

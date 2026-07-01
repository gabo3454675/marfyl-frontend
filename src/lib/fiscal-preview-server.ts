/** Detección de vista previa fiscal usable en middleware (sin `window`). */
export function isFiscalPreviewModeServer(): boolean {
  const envVar = process.env.NEXT_PUBLIC_FISCAL_PREVIEW;
  const nodeEnv = process.env.NODE_ENV;
  let result = false;
  if (envVar === 'true') result = true;
  else if (envVar === 'false') result = false;
  else result = nodeEnv === 'development';

  console.log('[fiscal-preview-server] isFiscalPreviewModeServer:', { envVar, nodeEnv, result });
  return result;
}

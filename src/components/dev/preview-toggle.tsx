'use client';

import { useState, useEffect } from 'react';

/**
 * Toggle para activar/desactivar el modo Preview (vista previa sin login).
 * Solo visible en desarrollo. Persiste en localStorage.
 */
export function PreviewToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Leer estado actual
    const w = window as Window & { __MARFYL_FISCAL_PREVIEW__?: boolean };
    setEnabled(w.__MARFYL_FISCAL_PREVIEW__ === true);
  }, []);

  const toggle = () => {
    const w = window as Window & { __MARFYL_FISCAL_PREVIEW__?: boolean };
    const next = !enabled;
    w.__MARFYL_FISCAL_PREVIEW__ = next;
    localStorage.setItem('marfyl_preview', next ? 'true' : 'false');
    setEnabled(next);
    // Recargar para que el middleware y el auth store se actualicen
    window.location.reload();
  };

  // No renderizar en producción
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggle}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium shadow-lg transition-all ${
          enabled
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        }`}
        title={enabled ? 'Preview activado — click para desactivar y usar login real' : 'Preview desactivado — click para activar vista previa sin login'}
      >
        <span className={`h-2 w-2 rounded-full ${enabled ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
        {enabled ? 'Preview ON' : 'Preview OFF'}
      </button>
    </div>
  );
}

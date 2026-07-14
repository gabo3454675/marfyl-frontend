export const THEME_STORAGE_KEY = 'marfyl-theme';

export type Theme = 'light' | 'dark';

/** Link público de compra de entradas — siempre oscuro (no depende del tema del sistema ni preferencia guardada). */
export function isConcertTicketPath(pathname: string): boolean {
  return /^\/evento\/[^/]+/.test(pathname);
}

/** Rutas públicas (marketing, auth, evento) — modo oscuro si no hay preferencia guardada. */
export function isPublicSurfacePath(pathname: string): boolean {
  return (
    pathname === '/empresa' ||
    pathname.startsWith('/caracteristicas') ||
    pathname.startsWith('/precios') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/recover-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/evento') ||
    pathname === '/entradas' ||
    pathname === '/demo'
  );
}

export function readPersistedTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      localStorage.getItem(THEME_STORAGE_KEY) ?? localStorage.getItem('disis-theme');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { theme?: string } };
    const t = parsed?.state?.theme;
    return t === 'dark' || t === 'light' ? t : null;
  } catch {
    return null;
  }
}

/** Tema inicial: boletería siempre oscura > preferencia guardada > oscuro en público > claro en app. */
export function resolveThemeForPath(pathname: string): Theme {
  if (isConcertTicketPath(pathname)) return 'dark';
  const saved = readPersistedTheme();
  if (saved) return saved;
  return isPublicSurfacePath(pathname) ? 'dark' : 'light';
}

export function applyThemeClass(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

/** Script inline (layout) — misma lógica antes del primer paint. */
export const THEME_INIT_SCRIPT = `(function(){var k='${THEME_STORAGE_KEY}';try{var p=window.location.pathname;if(/^\\/evento\\/[^/]+/.test(p)){document.documentElement.classList.add('dark');return;}var v=localStorage.getItem(k)||localStorage.getItem('disis-theme');var pub=/^\\/(empresa|caracteristicas|precios|blog|login|register|recover-password|reset-password|evento|entradas|demo)(\\/|$)/.test(p);if(v){var s=JSON.parse(v);if(s&&s.state&&s.state.theme==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}else if(pub)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){document.documentElement.classList.remove('dark');}})();`;

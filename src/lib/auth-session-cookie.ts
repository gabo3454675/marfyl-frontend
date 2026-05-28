/** Cookie legible en middleware para saber si hay sesión (complementa localStorage). */
export const SESSION_COOKIE_NAME = 'marfyl_session';

const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 días

export function setSessionCookie(): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; max-age=${MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

export function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export function readSessionCookieFromDocument(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${SESSION_COOKIE_NAME}=1`));
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth-session-cookie';
import { isFiscalPreviewModeServer } from '@/lib/fiscal-preview-server';
import { EXPLICIT_LOGOUT_FLAG } from '@/lib/fiscal-preview';

function hasSession(request: NextRequest): boolean {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value === '1';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const preview = isFiscalPreviewModeServer();
  const session = hasSession(request);
  const explicitLogout = request.cookies.get(EXPLICIT_LOGOUT_FLAG)?.value === '1';

  // Raíz: marketing si no hay sesión (producción y visitantes nuevos)
  if (pathname === '/' && !session && !preview) {
    return NextResponse.redirect(new URL('/empresa', request.url));
  }

  // Ya logueado: no mostrar login
  if (session && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!session && pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Vista previa dev: saltar login (excepto si el usuario hizo logout explícito)
  if (preview && pathname === '/login' && !explicitLogout) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/onboarding'],
};

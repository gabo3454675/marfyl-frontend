import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth-session-cookie';
import { isFiscalPreviewModeServer } from '@/lib/fiscal-preview-server';

function hasSession(request: NextRequest): boolean {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value === '1';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const preview = isFiscalPreviewModeServer();
  const session = hasSession(request);

  // Raíz: marketing si no hay sesión (producción y visitantes nuevos)
  if (pathname === '/' && !session && !preview) {
    return NextResponse.redirect(new URL('/empresa', request.url));
  }

  // Ya logueado: no mostrar login
  if (session && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Vista previa dev: saltar login
  if (preview && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register'],
};

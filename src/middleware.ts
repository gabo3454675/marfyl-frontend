import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth-session-cookie';

function hasSession(request: NextRequest): boolean {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value === '1';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = hasSession(request);

  if (!session && pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/onboarding'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'sulekha_access_token';
const PUBLIC_PATHS = ['/', '/login'];
const IGNORED_PATHS = ['/_next', '/api', '/static', '/favicon.ico', '/robots.txt', '/manifest.json'];

const isIgnoredPath = (pathname: string) =>
  IGNORED_PATHS.some((prefix) => pathname.startsWith(prefix)) || pathname.includes('/_next/') || pathname.includes('/static/');

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isIgnoredPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (PUBLIC_PATHS.includes(pathname)) {
    if (pathname === '/login' && token) {
      const redirectUrl = request.nextUrl.clone();
      // Respect the originally-intended destination when one was provided.
      const redirect = request.nextUrl.searchParams.get('redirect');
      redirectUrl.pathname = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard';
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|static|favicon.ico).*)'],
};

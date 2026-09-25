import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'sulekha_access_token';
const PUBLIC_PATHS = ['/', '/login'];
const IGNORED_PATHS = ['/_next', '/api', '/static', '/favicon.ico', '/robots.txt', '/manifest.json', '/sitemap.xml'];

/**
 * Static files must never reach the auth check.
 *
 * Without this, a signed out request for /icon.png or /logo.jpeg was answered
 * with a redirect to /login: the browser received HTML where it expected an
 * image, so the declared tab icon failed to load and it fell back to the
 * framework default that ships at /favicon.ico. It also broke the social share
 * image, because crawlers request /logo.jpeg unauthenticated.
 */
const STATIC_FILE_PATTERN =
  /\.(?:ico|png|jpe?g|gif|svg|webp|avif|bmp|txt|xml|json|webmanifest|woff2?|ttf|otf|eot|mp4|webm|pdf)$/i;

const isIgnoredPath = (pathname: string) =>
  IGNORED_PATHS.some((prefix) => pathname.startsWith(prefix)) ||
  pathname.includes('/_next/') ||
  pathname.includes('/static/') ||
  STATIC_FILE_PATTERN.test(pathname);

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
  // Skips the framework internals, the API and anything with a file extension
  // (public assets such as /icon.png, /apple-icon.png, /logo.jpeg). The check in
  // isIgnoredPath() stays as the single source of truth in case the matcher is
  // ever broadened again.
  matcher: ['/((?!_next|api|static|.*\\..*).*)'],
};

import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { auth } from './auth';
import { defaultLocale, locales } from './i18n/config';
import { routing } from './i18n/routing';
import {
  isAdminRoute,
  isProtectedRoute,
  isPublicDocsRoute,
  isPublicRoute,
} from './shared/lib/routes';

const intlMiddleware = createMiddleware(routing);

/**
 * Extract the pathname without locale prefix
 */
function getPathWithoutLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
    if (pathname === `/${locale}`) {
      return '/';
    }
  }
  return pathname;
}

/**
 * Get the locale from the pathname
 */
function getLocaleFromPath(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return defaultLocale;
}

/**
 * Create a redirect URL with locale
 */
function createLocalizedUrl(
  request: NextRequest,
  path: string,
  locale: string
): URL {
  const url = new URL(`/${locale}${path}`, request.url);
  return url;
}

export default auth(async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.includes('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  // Get path without locale and current locale
  const pathWithoutLocale = getPathWithoutLocale(pathname);
  const locale = getLocaleFromPath(pathname);

  // Get session from auth
  const session = request.auth;
  const isAuthenticated = !!session?.user;
  const isAdmin = session?.user?.isAdmin ?? false;

  // Public docs are accessible to everyone
  if (isPublicDocsRoute(pathWithoutLocale)) {
    return intlMiddleware(request);
  }

  // Redirect authenticated users away from login/register pages
  if (isAuthenticated && isPublicRoute(pathWithoutLocale)) {
    const redirectUrl = createLocalizedUrl(request, '/', locale);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && isProtectedRoute(pathWithoutLocale)) {
    const redirectUrl = createLocalizedUrl(request, '/login', locale);
    // Store the original URL to redirect back after login
    redirectUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect non-admin users away from admin routes
  if (isAdminRoute(pathWithoutLocale)) {
    if (!isAuthenticated) {
      const redirectUrl = createLocalizedUrl(request, '/login', locale);
      redirectUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    if (!isAdmin) {
      const redirectUrl = createLocalizedUrl(request, '/', locale);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Continue with i18n middleware for all other cases
  return intlMiddleware(request);
});

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// UX-only gate: redirects an obviously-unauthenticated visitor away from
// protected pages before a flash of protected UI. It is NOT the security
// boundary — every API request is authorized server-side by the API's
// JwtAuthGuard regardless of what this middleware does.
const PROTECTED_SEGMENTS = ['dashboard', 'lab'];

export default function middleware(request: NextRequest) {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  const [locale, firstSegment] = segments;

  if (firstSegment && PROTECTED_SEGMENTS.includes(firstSegment)) {
    const hasToken = request.cookies.has('eu_token');
    if (!hasToken) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Skip API routes, Next internals, and files with an extension (static assets).
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PREFIXES = ['/login', '/_next', '/icon-', '/apple-touch-icon', '/favicon'];
const PUBLIC_EXACT = new Set([
  '/manifest.webmanifest',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_EXACT.has(pathname)) return NextResponse.next();
  for (const p of PUBLIC_PREFIXES) {
    if (pathname.startsWith(p)) return NextResponse.next();
  }
  const hasSession = request.cookies.has('romme_session');
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.ico$).*)'],
};

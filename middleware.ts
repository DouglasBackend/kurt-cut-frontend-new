import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith('/_next') || pathname.startsWith('/api')
  );

  if (isPublic) return NextResponse.next();

  // Token check happens client-side via AuthContext; middleware just passes through.
  // If you want server-side protection, check a cookie here.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

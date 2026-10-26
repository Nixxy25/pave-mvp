import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_HOSTNAME = 'admin.pavee.co';

export function proxy(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  const hostname = host.split(',')[0].trim().split(':')[0].toLowerCase();
  const { pathname } = request.nextUrl;

  if (
    hostname !== ADMIN_HOSTNAME ||
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/')
  ) {
    return NextResponse.next();
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`;
  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

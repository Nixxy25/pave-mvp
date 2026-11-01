import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

function isAdminPath(pathname: string): boolean {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/')
  );
}

export function proxy(request: NextRequest) {
  if (!isAdminPath(request.nextUrl.pathname)) return NextResponse.next();

  if (process.env.PAVE_ADMIN_ENABLED === 'true') return NextResponse.next();

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  const hostname = host.split(',')[0].trim().toLowerCase().replace(/:\d+$/, '');
  if (LOCAL_HOSTNAMES.has(hostname)) return NextResponse.next();

  return new NextResponse(null, { status: 404 });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

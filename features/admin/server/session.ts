import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/auth/admin-session';
import { getPaveAdminRole } from '@/lib/auth/roles';
import { verifyPrivyAccessToken } from '@/lib/auth/privy';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const identity = await verifyPrivyAccessToken(authHeader.slice(7));
  if (!identity?.expiresAt) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  const role = getPaveAdminRole(identity.userId);
  if (!role) {
    return NextResponse.json({ error: 'Admin access is not authorized' }, { status: 403 });
  }

  const response = NextResponse.json({ role });
  response.cookies.set(ADMIN_SESSION_COOKIE, authHeader.slice(7), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(identity.expiresAt * 1000),
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPaveAdminRole } from './roles';
import { verifyPrivyAccessToken } from './privy';

export const ADMIN_SESSION_COOKIE = 'pave_admin_session';

export interface AdminSession {
  userId: string;
  role: NonNullable<ReturnType<typeof getPaveAdminRole>>;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const identity = await verifyPrivyAccessToken(token);
  if (!identity?.expiresAt) return null;

  const role = getPaveAdminRole(identity.userId);
  return role ? { userId: identity.userId, role } : null;
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return session;
}

import 'server-only';

export type PaveAdminRole = 'SUPER_ADMIN' | 'ADMIN';
export type PaveRole = PaveAdminRole | 'MERCHANT';

function includesUserId(variableName: string, userId: string): boolean {
  return (process.env[variableName] ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(userId);
}

export function getPaveAdminRole(userId: string): PaveAdminRole | null {
  if (includesUserId('PAVE_SUPER_ADMIN_USER_IDS', userId)) return 'SUPER_ADMIN';
  if (includesUserId('PAVE_ADMIN_USER_IDS', userId)) return 'ADMIN';
  return null;
}

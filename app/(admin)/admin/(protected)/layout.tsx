import { AdminShell } from '@/features/admin/AdminShell';
import { requireAdminSession } from '@/lib/auth/admin-session';

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await requireAdminSession();
  return <AdminShell role={role}>{children}</AdminShell>;
}

import { requireAdminSession } from '@/lib/auth/admin-session';

export default async function AdminOverviewPage() {
  const { role } = await requireAdminSession();

  return (
    <section>
      <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Internal operations
      </p>
      <h1 className="mb-3 font-serif text-3xl">Overview</h1>
      <p className="text-sm text-muted-foreground">
        The Admin module foundation is ready. Operations features will be added in a later phase.
      </p>
      <p className="mt-6 text-xs text-muted-foreground">Access: {role}</p>
    </section>
  );
}

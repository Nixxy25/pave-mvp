import { notFound } from 'next/navigation';
import { ADMIN_NAVIGATION } from '@/features/admin/navigation';
import { requireAdminSession } from '@/lib/auth/admin-session';

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  await requireAdminSession();
  const { section } = await params;
  const item = ADMIN_NAVIGATION.find((entry) => entry.slug === section && entry.slug);
  if (!item) notFound();

  return (
    <section>
      <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Internal operations
      </p>
      <h1 className="mb-3 font-serif text-3xl">{item.label}</h1>
      <p className="text-sm text-muted-foreground">
        This section is reserved for a future Admin implementation.
      </p>
    </section>
  );
}

import Link from 'next/link';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminPagination,
  AdminSectionCard,
  formatAdminDate,
  ShortReference,
} from '@/features/admin/components/AdminPrimitives';
import { getAdminMerchants } from '@/features/admin/server/data';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminMerchantsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const requestedPage = Number(typeof params.page === 'string' ? params.page : 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 100_000) : 1;

  let result: Awaited<ReturnType<typeof getAdminMerchants>>;
  try {
    result = await getAdminMerchants({ page, search: q });
  } catch {
    return <AdminErrorState section="merchants" />;
  }
  return (
      <section className="space-y-6">
        <AdminPageHeader
          title="Merchants"
          description="Review merchant profile information and historical payment activity. Credentials are excluded."
        />
        <form action="/admin/merchants" method="get" className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search merchants</span>
            <Search aria-hidden="true" className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search name, business, email or Privy user ID" className="h-10 pl-9" />
          </label>
          <Button type="submit" className="h-10">Search</Button>
          {q && <Button variant="outline" asChild className="h-10"><Link href="/admin/merchants">Clear</Link></Button>}
        </form>
        <AdminSectionCard title="Merchant directory" description={`${result.total.toLocaleString()} merchants`}>
          {!result.rows.length ? (
            <AdminEmptyState message="No merchants match this search." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Privy user ID</TableHead>
                    <TableHead>Stellar wallet</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Payment activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((merchant) => (
                    <TableRow key={merchant.privy_user_id}>
                      <TableCell>
                        <Link className="font-medium text-[var(--pave-orange)] hover:underline" href={`/admin/merchants/${encodeURIComponent(merchant.privy_user_id)}`}>
                          {merchant.full_name || 'Unnamed merchant'}
                        </Link>
                      </TableCell>
                      <TableCell>{merchant.business_name || '—'}</TableCell>
                      <TableCell>{merchant.email || '—'}</TableCell>
                      <TableCell><ShortReference value={merchant.privy_user_id} /></TableCell>
                      <TableCell><ShortReference value={merchant.stellar_address} /></TableCell>
                      <TableCell>{formatAdminDate(merchant.created_at)}</TableCell>
                      <TableCell>{merchant.payment_count.toLocaleString()} payments</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <AdminPagination page={result.page} totalPages={result.totalPages} total={result.total} basePath="/admin/merchants" search={q} />
        </AdminSectionCard>
        <p className="text-xs text-muted-foreground">Merchant profiles are read-only here. API secrets and wallet-provisioning credentials are not selected or displayed.</p>
      </section>
  );
}

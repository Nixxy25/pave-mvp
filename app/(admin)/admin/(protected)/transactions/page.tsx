import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AdminErrorState,
  AdminPageHeader,
  AdminPagination,
  AdminSectionCard,
  TransactionTable,
} from '@/features/admin/components/AdminPrimitives';
import { getAdminTransactions } from '@/features/admin/server/data';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminTransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const status = typeof params.status === 'string' ? params.status : '';
  const requestedPage = Number(typeof params.page === 'string' ? params.page : 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 100_000) : 1;

  let result: Awaited<ReturnType<typeof getAdminTransactions>>;
  try {
    result = await getAdminTransactions({ page, search: q, status });
  } catch {
    return <AdminErrorState section="transactions" />;
  }
  return (
      <section className="space-y-6">
        <AdminPageHeader
          title="Transactions"
          description="Search and review existing customer payment records. Blockchain details are read-only."
        />
        <form action="/admin/transactions" method="get" className="flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search payments</span>
            <Search aria-hidden="true" className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search payer, merchant, payment ID or Stellar hash" className="h-10 pl-9" />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select name="status" defaultValue={status} className="h-10 w-full border border-input bg-background px-3 text-sm sm:w-44">
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="expired">Expired</option>
            </select>
          </label>
          <Button type="submit" className="h-10">Apply filters</Button>
          {(q || status) && <Button variant="outline" asChild className="h-10"><Link href="/admin/transactions">Clear</Link></Button>}
        </form>
        <AdminSectionCard title="Payment records" description={`${result.total.toLocaleString()} matching transactions`}>
          <div className="overflow-x-auto">
            <TransactionTable rows={result.rows} />
          </div>
          <AdminPagination page={result.page} totalPages={result.totalPages} total={result.total} basePath="/admin/transactions" search={q} status={status} />
        </AdminSectionCard>
        <p className="text-xs text-muted-foreground">Verified chain transaction details cannot be modified from this dashboard.</p>
      </section>
  );
}

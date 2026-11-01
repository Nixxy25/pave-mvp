import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AdminErrorState,
  AdminMetric,
  AdminPageHeader,
  AdminPagination,
  AdminSectionCard,
  formatAdminDate,
  TransactionTable,
} from '@/features/admin/components/AdminPrimitives';
import { getAdminMerchant } from '@/features/admin/server/data';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminMerchantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const requestedPage = Number(typeof query.page === 'string' ? query.page : 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 100_000) : 1;

  let result: Awaited<ReturnType<typeof getAdminMerchant>>;
  try {
    result = await getAdminMerchant(id, { page });
  } catch {
    return <AdminErrorState section="merchant details" />;
  }
  if (!result) notFound();
  const { merchant, payments } = result;

  return (
      <section className="space-y-6">
        <Button variant="outline" size="sm" asChild><Link href="/admin/merchants"><ArrowLeft aria-hidden="true" /> Back to merchants</Link></Button>
        <AdminPageHeader
          title={merchant.business_name || merchant.full_name || 'Merchant details'}
          description="Read-only merchant profile and payment history."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AdminMetric label="All payment records" value={payments.total.toLocaleString()} detail="Historical payment rows for this merchant" icon={<span aria-hidden="true">#</span>} />
          <AdminMetric label="Completed records" value={result.completedCount.toLocaleString()} detail="Records marked completed; not a payout balance" icon={<span aria-hidden="true">✓</span>} />
          <AdminMetric label="Merchant balance" value="Not available" detail="No deployed verified ledger balance" icon={<span aria-hidden="true">$</span>} placeholder />
        </div>
        <Card>
          <CardHeader><CardTitle>Merchant profile</CardTitle></CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div><p className="text-xs text-muted-foreground">Full name</p><p className="mt-1 text-sm">{merchant.full_name || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Business name</p><p className="mt-1 text-sm">{merchant.business_name || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Email</p><p className="mt-1 break-all text-sm">{merchant.email || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Privy user ID</p><p className="mt-1 break-all font-mono text-xs">{merchant.privy_user_id}</p></div>
            <div><p className="text-xs text-muted-foreground">Stellar wallet</p><p className="mt-1 break-all font-mono text-xs">{merchant.stellar_address || 'Not configured'}</p></div>
            <div><p className="text-xs text-muted-foreground">Registered</p><p className="mt-1 text-sm">{formatAdminDate(merchant.created_at)}</p></div>
          </CardContent>
        </Card>
        <AdminSectionCard title="Payment activity" description={`${payments.total.toLocaleString()} associated payment records`}>
          <div className="overflow-x-auto">
            <TransactionTable rows={payments.rows.map((payment) => ({
              ...payment,
              merchant_name: merchant.business_name || merchant.full_name || 'Unnamed merchant',
              paid_with: null,
            }))} />
          </div>
          <AdminPagination page={payments.page} totalPages={payments.totalPages} total={payments.total} basePath={`/admin/merchants/${encodeURIComponent(id)}`} />
        </AdminSectionCard>
    </section>
  );
}

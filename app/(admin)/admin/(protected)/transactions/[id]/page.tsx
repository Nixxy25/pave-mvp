import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminErrorState, AdminPageHeader, AdminStatus, formatAdminDate, formatAmount, ShortReference } from '@/features/admin/components/AdminPrimitives';
import { getAdminTransaction } from '@/features/admin/server/data';

export default async function AdminTransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let transaction: Awaited<ReturnType<typeof getAdminTransaction>>;
  try {
    transaction = await getAdminTransaction(id);
  } catch {
    return <AdminErrorState section="transaction details" />;
  }
  if (!transaction) notFound();

  const fields = [
      ['Payment ID', transaction.id],
      ['Customer reference', transaction.payer_name],
      ['Customer email', transaction.payer_email],
      ['Amount', formatAmount(transaction.amount, transaction.currency)],
      ['USDC equivalent', formatAmount(transaction.usdc_amount, 'USDC')],
      ['Payment method', transaction.method || transaction.paid_with],
      ['Status', transaction.status],
      ['Stellar transaction hash', transaction.stellar_tx_hash],
      ['Created', formatAdminDate(transaction.created_at)],
      ['Source', transaction.source],
      ['Description', transaction.description],
      ['Checkout link', transaction.checkout_link_id],
      ['Checkout link status', transaction.checkout_link?.status],
  ] as const;

  return (
      <section className="space-y-6">
        <Button variant="outline" size="sm" asChild><Link href="/admin/transactions"><ArrowLeft aria-hidden="true" /> Back to transactions</Link></Button>
        <AdminPageHeader title="Transaction details" description="Read-only payment record and associated merchant details." />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Payment record</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {fields.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {label === 'Status'
                    ? <AdminStatus status={value ?? null} />
                    : label === 'Stellar transaction hash' || label === 'Payment ID' || label === 'Checkout link'
                      ? <p className="mt-1 break-all font-mono text-xs"><ShortReference value={value == null ? null : String(value)} /></p>
                      : <p className="mt-1 break-words text-sm">{value == null || value === '' ? '—' : String(value)}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Merchant</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Name</p><p className="mt-1">{transaction.merchant?.business_name || transaction.merchant?.full_name || 'Merchant unavailable'}</p></div>
              <div><p className="text-xs text-muted-foreground">Email</p><p className="mt-1">{transaction.merchant?.email || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Privy user ID</p><p className="mt-1 break-all font-mono text-xs">{transaction.merchant_id}</p></div>
              <div><p className="text-xs text-muted-foreground">Stellar wallet</p><p className="mt-1 break-all font-mono text-xs">{transaction.merchant?.stellar_address || 'Not configured'}</p></div>
              {transaction.merchant && (
                <Button variant="outline" size="sm" asChild><Link href={`/admin/merchants/${encodeURIComponent(transaction.merchant.privy_user_id)}`}>View merchant</Link></Button>
              )}
            </CardContent>
          </Card>
        </div>
      <p className="text-xs text-muted-foreground">Legacy settlement fields are not shown as proof of a merchant payout. This view does not modify payment, transaction, or ledger records.</p>
    </section>
  );
}

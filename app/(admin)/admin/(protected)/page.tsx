import { Activity, AlertTriangle, BadgeDollarSign, CircleDollarSign, Wallet } from 'lucide-react';
import { AdminMetric, AdminPageHeader, AdminReadOnlyNotice, AdminSectionCard, AdminErrorState, TransactionTable } from '@/features/admin/components/AdminPrimitives';
import { getAdminOverview } from '@/features/admin/server/data';
import { getEngineSummary } from '@/features/admin/server/payment-engine';

export default async function AdminOverviewPage() {
  let overview: Awaited<ReturnType<typeof getAdminOverview>>;
  const ledger = await getEngineSummary();
  try {
    overview = await getAdminOverview();
  } catch {
    return <AdminErrorState section="the Admin overview" />;
  }

  const { counts, recent } = overview;
  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="Overview"
        description="Platform activity from the existing payment and merchant records."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AdminMetric
            label="Payment volume"
            value="Unavailable"
            detail="No verified platform-wide aggregate is available in the current schema."
            icon={<CircleDollarSign className="h-4 w-4" />}
            placeholder
          />
          <AdminMetric
            label="Successful payments"
            value={counts.completed.toLocaleString()}
            detail={`${counts.total.toLocaleString()} payment records total`}
            icon={<Activity className="h-4 w-4" />}
          />
          <AdminMetric
            label="Pending payments"
            value={counts.pending.toLocaleString()}
            detail="Existing payment records marked pending"
            icon={<BadgeDollarSign className="h-4 w-4" />}
          />
          <AdminMetric
            label="Failed and expired"
            value={(counts.failed + counts.expired).toLocaleString()}
            detail={`${counts.failed} failed · ${counts.expired} expired`}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <AdminMetric
            label="Total received"
            value={ledger.status === 'ok' ? `USDC ${Number(ledger.data.totalReceived).toLocaleString()}` : 'Unavailable'}
            detail="Verified USDC paid directly to merchant wallets. Pave takes no commission."
            icon={<CircleDollarSign className="h-4 w-4" />}
            placeholder={ledger.status !== 'ok'}
          />
          <AdminMetric
            label="Ready merchant wallets"
            value={ledger.status === 'ok' ? ledger.data.readyWallets.toLocaleString() : 'Unavailable'}
            detail="Turnkey-managed wallets ready to receive."
            icon={<Wallet className="h-4 w-4" />}
            placeholder={ledger.status !== 'ok'}
          />
          <AdminMetric
            label="Failed wallets"
            value={ledger.status === 'ok' ? ledger.data.failedWallets.toLocaleString() : 'Unavailable'}
            detail="Wallet provisioning failures needing attention."
            icon={<AlertTriangle className="h-4 w-4" />}
            placeholder={ledger.status !== 'ok'}
          />
          <AdminMetric
            label="Open reconciliation"
            value={ledger.status === 'ok' ? ledger.data.openReconciliation.toLocaleString() : 'Unavailable'}
            detail="Chain payments that could not be matched to a session."
            icon={<BadgeDollarSign className="h-4 w-4" />}
            placeholder={ledger.status !== 'ok'}
          />
      </div>

      <AdminReadOnlyNotice>
        Payments are verified on the network before they are recorded. Bank settlement is locked (Coming soon).
      </AdminReadOnlyNotice>

      <AdminSectionCard
        title="Recent transactions"
        description="Latest payment records from Supabase."
        action={<span className="text-xs text-text-muted">{counts.merchants} merchants</span>}
      >
        <div className="overflow-x-auto">
          <TransactionTable rows={recent} />
        </div>
      </AdminSectionCard>
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/features/merchant/auth/AuthContext';
import { authFetch } from '@/lib/fetch-api';
import { getUserProfile } from '@/features/merchant/api/user';
import { useLedgerBalance } from '@/features/merchant/hooks/useLedgerBalance';
import { useLedgerTransactions } from '@/features/merchant/hooks/useLedgerTransactions';
import { PageContainer, PageHeader } from '@/components/shared/PageLayout';
import { StatsCards } from './StatsCards';
import { LedgerRecentActivity } from './LedgerRecentActivity';
import type { Merchant } from '@/types';

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<Merchant | null>(null);
  const { data: ledger, loading: balanceLoading, error: balanceError, refetch } = useLedgerBalance(isAuthenticated);
  const { data: transactions, loading: transactionsLoading, error: transactionError } = useLedgerTransactions({
    enabled: isAuthenticated,
    page: 1,
    status: 'all',
    search: '',
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    getUserProfile().then(setUser).catch((error: unknown) => {
      console.error('[merchant-dashboard] Profile unavailable:', error);
    });
  }, [isAuthenticated]);

  const walletReady = ledger?.wallet?.status === 'ready';
  const [provisioning, setProvisioning] = useState(false);

  // First visit: create the merchant's permanent receiving wallet, then reload.
  useEffect(() => {
    if (!isAuthenticated || balanceLoading || !ledger || walletReady || provisioning) return;
    setProvisioning(true);
    authFetch('/api/merchant/wallet')
      .then((response) => { if (response.ok) refetch(); })
      .catch(() => undefined)
      .finally(() => setProvisioning(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, balanceLoading, ledger, walletReady]);

  const loading = balanceLoading || transactionsLoading;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-border border-t-[var(--pave-orange)]" />
      </div>
    );
  }

  if (balanceError || transactionError) {
    return (
      <PageContainer>
        <div role="alert" className="rounded-xl border border-status-failed/30 bg-status-failed-bg p-4 text-sm text-status-failed">
          Merchant financial data is temporarily unavailable. Please try again later.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        className="animate-fadeup"
        title={`Welcome, ${user?.name.split(' ')[0] || 'there'}`}
        description={`Your payment activity — ${new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}`}
      />

      <StatsCards ledger={ledger} />
      <LedgerRecentActivity rows={(transactions?.rows ?? []).slice(0, 10)} />
    </PageContainer>
  );
}

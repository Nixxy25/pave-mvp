'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance, usePayments } from '@/hooks';
import { getUserProfile, getStats } from '@/lib/api';
import { StatsCards } from './StatsCards';
import { RecentActivityTable } from './RecentActivityTable';
import type { Merchant, Payment } from '@/types';

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<Merchant | null>(null);
  const { balance, loading: balanceLoading } = useBalance();
  const { payments, loading: paymentsLoading } = usePayments();

  useEffect(() => {
    if (!isAuthenticated) return;
    getUserProfile().then(setUser).catch(() => {});
    getStats().catch(() => {});
  }, [isAuthenticated]);

  // Derive activities directly from payments
  const activities = payments
    .map((p: Payment) => ({ ...p, type: 'payment' as const }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const loading = balanceLoading || paymentsLoading;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--pave-orange)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[980px] px-4 py-6 pb-20 sm:px-7 sm:py-8">
      {/* Greeting */}
      <div className="mb-6.5 animate-fadeup">
        <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          Dashboard
        </div>
        <h1 className="font-serif text-[24px] font-light italic leading-tight tracking-tight text-foreground sm:text-[27px]">
          Good morning,{' '}
          <strong className="font-medium not-italic">{user?.name.split(' ')[0] || 'there'}</strong>{' '}
          👋
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Here&apos;s your payment activity —{' '}
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Testnet badge */}
      <div
        className="mb-5.5 flex animate-fadeup items-center gap-3 rounded-lg border border-[var(--success-medium)] bg-[var(--success-light)] p-3 px-4"
        style={{ animationDelay: '0.07s' }}
      >
        <div className="h-2 w-2 flex-shrink-0 animate-blink rounded-full bg-[var(--success)]" />
        <div className="text-[13px] font-medium text-[var(--success)]">Pave testnet</div>
      </div>

      <StatsCards
        balance={balance}
        payments={payments}
        activities={activities}
      />

      <RecentActivityTable activities={activities} />
    </div>
  );
}

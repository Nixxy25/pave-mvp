'use client';

import type { AccountStats } from '@/types';

interface AccountStatsCardProps {
  stats: AccountStats | null;
}

export function AccountStatsCard({ stats }: AccountStatsCardProps) {
  return (
    <div
      className="animate-fadeup rounded-xl border bg-card p-4 sm:p-6"
      style={{ animationDelay: '0.21s' }}
    >
      <h2 className="mb-4 text-base font-semibold text-text-primary">
        Account Statistics
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="">
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-text-primary">
            {stats?.paymentCount ?? 0}
          </div>
          <div className="mt-1 text-sm text-text-secondary">Total Payments</div>
        </div>
        <div className="">
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-text-primary">
            USDC {stats?.totalVolume.toLocaleString() ?? '0'}
          </div>
          <div className="mt-1 text-sm text-text-secondary">Verified ledger volume</div>
        </div>
      </div>
    </div>
  );
}

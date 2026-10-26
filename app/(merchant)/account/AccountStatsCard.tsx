'use client';

import type { AccountStats } from '@/types';

interface AccountStatsCardProps {
  stats: AccountStats | null;
}

export function AccountStatsCard({ stats }: AccountStatsCardProps) {
  return (
    <div
      className="border bg-card p-4 shadow-sm animate-fadeup sm:p-6"
      style={{ animationDelay: '0.21s' }}
    >
      <h2 className="mb-4 font-serif text-lg font-light italic text-foreground">
        Account Statistics
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="text-center">
          <div className="font-serif text-2xl font-light italic text-foreground">
            {stats?.paymentCount ?? 0}
          </div>
          <div className="mt-1 text-xs text-foreground">Total Payments</div>
        </div>
        <div className="text-center">
          <div className="font-serif text-2xl font-light italic text-foreground">
            ${stats?.totalVolume.toLocaleString() ?? '0'}
          </div>
          <div className="mt-1 text-xs text-foreground">Total Volume</div>
        </div>
      </div>
    </div>
  );
}

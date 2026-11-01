'use client';

import { ArrowDown, ArrowUp, Lock, Minus } from 'lucide-react';
import type { MerchantLedgerData } from '@/features/merchant/api/ledger';

function formatAmount(value: string | undefined) {
  return Number(value ?? '0').toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  });
}

function Amount({ value }: { value: string }) {
  return (
    <>
      {value}
      <span className="ml-1.5 text-[0.72em] font-medium text-text-secondary">USDC</span>
    </>
  );
}

function ActivityToday({ today, yesterday }: { today: number | null | undefined; yesterday: number | null | undefined }) {
  if (today === null || today === undefined) return <p className="mt-1 text-2xl font-semibold text-text-primary">—</p>;
  const delta = yesterday === null || yesterday === undefined ? 0 : today - yesterday;
  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const tone = delta > 0 ? 'text-status-success' : delta < 0 ? 'text-status-failed' : 'text-text-muted';
  const label = delta === 0 ? 'Same as yesterday' : `${Math.abs(delta)} ${delta > 0 ? 'more' : 'fewer'} than yesterday`;
  return (
    <>
      <p className="mt-1 flex items-center gap-2 text-2xl font-semibold tabular-nums text-text-primary">
        {today.toLocaleString()}
        <Icon aria-hidden="true" className={`size-5 ${tone}`} />
      </p>
      <p className={`mt-1 text-xs ${tone}`}>{label}</p>
    </>
  );
}

export function StatsCards({ ledger }: { ledger: MerchantLedgerData | null }) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border bg-card">
      <div className="p-5 sm:p-6">
        <p className="text-sm text-text-secondary">Total received</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-text-primary sm:text-5xl">
          <Amount value={formatAmount(ledger?.totalReceived)} />
        </p>
        <p className="mt-3 text-xs text-text-muted">
          {(ledger?.totalPaymentCount ?? 0).toLocaleString()} verified payment{ledger?.totalPaymentCount === 1 ? '' : 's'} · Move your USDC to your local bank
        </p>
        <button type="button" disabled title="Bank settlement is coming soon" className="mt-3 inline-flex cursor-not-allowed items-center gap-2 rounded-none border border-border bg-muted px-3 py-1.5 text-xs font-medium text-text-muted">
          <Lock aria-hidden="true" className="size-3.5" /> Move to bank · Coming soon
        </button>
      </div>

      <div className="border-t px-5 py-4 sm:px-6">
        <p className="text-xs text-text-muted">Activity Today</p>
        <ActivityToday today={ledger?.paymentsToday} yesterday={ledger?.paymentsYesterday} />
      </div>

      {ledger?.wallet && ledger.wallet.status !== 'ready' && (
        <p className="border-t px-5 py-3 text-xs text-status-pending sm:px-6">
          Your receiving wallet is being set up. Checkout opens once it is ready.
        </p>
      )}
    </section>
  );
}

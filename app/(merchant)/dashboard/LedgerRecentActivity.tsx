'use client';

import { networkLabel } from '@/lib/stellar-explorer';
import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { MerchantFinancialTransaction } from '@/features/merchant/types/ledger';

export function LedgerRecentActivity({ rows }: { rows: MerchantFinancialTransaction[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Payment Activity</h2>
          <p className="mt-0.5 text-sm text-text-secondary">Payments verified on-chain and received in your wallet.</p>
        </div>
        <Link href="/payments" className="shrink-0 text-sm font-medium text-[var(--pave-orange)] hover:underline">View all</Link>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-text-muted">No payments recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs font-medium text-text-muted">
              <tr>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Payment</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Customer</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Amount</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Network</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Status</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.paymentId} className="border-t transition-colors hover:bg-muted/40">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-text-secondary">{row.paymentId.slice(0, 12)}…</td>
                  <td className="px-4 py-3 text-text-primary">{row.customerName}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-text-primary">{row.assetAmount === null ? '—' : `USDC ${row.assetAmount.toLocaleString()}`}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{networkLabel(row.network)}</td>
                  <td className="px-4 py-3"><StatusBadge status="verified" label="Verified" /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-muted">{new Date(row.paymentDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DataTableHeader, type TableColumn } from '@/components/ui/data-table';
import { formatTimeAgo } from '@/lib/api/helpers';
import type { Payment } from '@/types';

const COLUMNS: TableColumn[] = [
  { key: 'type', label: 'Type', className: 'px-5' },
  { key: 'customer', label: 'Customer', className: 'px-5' },
  { key: 'amount', label: 'Amount', className: 'px-5' },
  { key: 'usdc', label: 'USDC', className: 'px-5' },
  { key: 'txId', label: 'TX ID', className: 'px-5' },
  { key: 'time', label: 'Time', className: 'px-5' },
  { key: 'status', label: 'Status', align: 'right', className: 'px-5' },
];

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
}

function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    completed: 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success-medium)]',
    settled: 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success-medium)]',
    processing: 'bg-orange-100 text-orange-700 border-orange-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
  };
  const dot =
    status === 'completed' || status === 'settled'
      ? 'bg-[var(--success)]'
      : status === 'processing'
        ? 'bg-orange-500'
        : 'bg-gray-400';

  return (
    <Badge variant="outline" className={`${colors[status] || 'bg-muted text-muted-foreground'} border`}>
      <div className={`mr-1 h-1.5 w-1.5 rounded-full ${dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

interface RecentActivityTableProps {
  activities: Array<Payment & { type: 'payment' }>;
}

export function RecentActivityTable({ activities }: RecentActivityTableProps) {
  return (
    <div className="rounded-[14px] border bg-card shadow-sm animate-fadeup" style={{ animationDelay: '0.21s' }}>
      <div className="flex items-center justify-between border-b p-5 pb-4">
        <div>
          <h2 className="font-serif text-[19px] font-light italic text-foreground">
            Recent Activity
          </h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Live feed — updates on each ledger close
          </p>
        </div>
        <Link
          href="/payments"
          className="rounded-lg border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
        >
          View All
        </Link>
      </div>

      <div className="overflow-x-auto">
        {activities.length === 0 ? (
          <div className="px-6 py-12 text-center text-[13.5px] text-muted-foreground">
            No activity yet.{' '}
            <Link
              href="/checkout-links"
              className="font-medium text-[var(--pave-orange)] hover:underline"
            >
              Create your first checkout link
            </Link>{' '}
            to get started.
          </div>
        ) : (
          <table className="w-full">
            <DataTableHeader columns={COLUMNS} />
            <tbody>
              {activities.map((activity) => {
                const payment = activity;

                return (
                  <tr key={activity.id} className="border-b transition-colors hover:bg-muted/50">
                    {/* Type */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--success-light)]">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--success)]">
                            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </div>
                        <span className="text-[13px] font-medium text-foreground">Payment</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--pave-orange)] to-[#ff8a00] font-mono text-[11px] font-medium text-white">
                          {getInitials(payment.payer.name)}
                        </div>
                        <div>
                          <div className="text-[13.5px] font-medium text-foreground">{payment.payer.name}</div>
                          <div className="font-mono text-[11.5px] text-muted-foreground">
                            {payment.description || payment.source} · {payment.payer.country}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5">
                      <div className="text-[13.5px] font-medium text-foreground">
                        {activity.currency} {activity.amount.toLocaleString()}
                      </div>
                      <div className="font-mono text-[11.5px] text-muted-foreground">
                        {payment.method}
                      </div>
                    </td>

                    {/* USDC */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[13.5px] font-medium text-[var(--success)]">
                        ${(payment.usdcAmount ?? 0).toLocaleString()}
                      </span>
                    </td>

                    {/* TX ID */}
                    <td className="px-5 py-3.5">
                      {(() => {
                        const txId = activity.id;
                        const stellarHash = payment.method === 'Stellar Wallet'
                          ? payment.stellarTxHash
                          : undefined;
                        if (!txId) return <span className="text-[12px] text-muted-foreground">—</span>;
                        const short = `${txId.slice(0, 6)}…${txId.slice(-4)}`;
                        if (stellarHash) {
                          return (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${stellarHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-[11.5px] text-[var(--stellar)] hover:underline"
                            >
                              {`${stellarHash.slice(0, 6)}…${stellarHash.slice(-4)}`}
                            </a>
                          );
                        }
                        return <span className="font-mono text-[11.5px] text-muted-foreground">{short}</span>;
                      })()}
                    </td>

                    {/* Time */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[12px] text-muted-foreground">
                        {formatTimeAgo(activity.createdAt)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-right">
                      {getStatusBadge(activity.status)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

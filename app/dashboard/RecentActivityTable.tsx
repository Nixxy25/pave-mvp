'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DataTableHeader, type TableColumn } from '@/components/ui/data-table';
import { formatTimeAgo } from '@/lib/api/helpers';
import { useExchangeRates, convertCurrency } from '@/hooks';
import { ShortAddress } from '@/components/ShortAddress';
import { API_ENDPOINTS } from '@/lib/constants';
import type { Payment } from '@/types';

const COLUMNS: TableColumn[] = [
  { key: 'type', label: 'Type', className: 'px-5' },
  { key: 'customer', label: 'Customer', className: 'px-5' },
  { key: 'amount', label: 'Amount', className: 'px-5' },
  { key: 'usdc', label: 'USDC', className: 'px-5' },
  { key: 'txId', label: 'TX ID', className: 'px-5' },
  { key: 'time', label: 'Time', className: 'px-5' },
  { key: 'status', label: 'Status', align: 'right', className: 'px-5' },
  { key: 'receipt', label: 'Receipt', align: 'right', className: 'px-5' },
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
      <div className={`mr-1 h-1.5 w-1.5 ${dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

interface RecentActivityTableProps {
  activities: Array<Payment & { type: 'payment' }>;
}

export function RecentActivityTable({ activities }: RecentActivityTableProps) {
  const { data: exchangeRates } = useExchangeRates();

  return (
    <div className="border bg-card shadow-sm animate-fadeup" style={{ animationDelay: '0.21s' }}>
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
          className="border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
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
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="flex h-6 w-6 items-center justify-center bg-[var(--success-light)] sm:h-7 sm:w-7">
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-[var(--success)] sm:h-[14px] sm:w-[14px]">
                            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </div>
                        <span className="text-[12px] font-medium text-foreground sm:text-[13px]">Payment</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-gradient-to-br from-[var(--pave-orange)] to-[#ff8a00] font-mono text-[10px] font-medium text-white sm:h-9 sm:w-9 sm:text-[11px]">
                          {getInitials(payment.payer.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12.5px] font-medium text-foreground sm:text-[13.5px]">{payment.payer.name}</div>
                          <div className="truncate font-mono text-[11px] text-muted-foreground sm:text-[11.5px]">
                            {payment.description || payment.source}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5">
                      <div className="whitespace-nowrap text-[12.5px] font-medium text-foreground sm:text-[13.5px]">
                        {activity.currency === 'XLM' && exchangeRates && payment.usdcAmount
                          ? `XLM ${convertCurrency(payment.usdcAmount, 'USD', 'XLM', exchangeRates).toFixed(2)}`
                          : `${activity.currency} ${activity.amount.toLocaleString()}`}
                      </div>
                      <div className="whitespace-nowrap font-mono text-[11.5px] text-muted-foreground">
                        {payment.method}
                      </div>
                    </td>

                    {/* USDC */}
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5">
                      <span className="whitespace-nowrap font-mono text-[12.5px] font-medium text-[var(--success)] sm:text-[13.5px]">
                        USDC {(payment.usdcAmount ?? 0).toLocaleString()}
                      </span>
                    </td>

                    {/* TX ID */}
                    <td className="whitespace-nowrap px-3 py-2.5 sm:px-5 sm:py-3.5">
                      {payment.method === 'Stellar Wallet' && payment.stellarTxHash ? (
                        <a
                          href={`${API_ENDPOINTS.STELLAR_EXPLORER_TESTNET}/tx/${payment.stellarTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          <ShortAddress
                            address={payment.stellarTxHash}
                            startChars={6}
                            endChars={4}
                            className="text-[11px] text-[var(--stellar)] sm:text-[11.5px]"
                          />
                        </a>
                      ) : (
                        <ShortAddress
                          address={activity.id}
                          startChars={6}
                          endChars={4}
                          className="text-[11px] text-muted-foreground sm:text-[11.5px]"
                        />
                      )}
                    </td>

                    {/* Time */}
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5">
                      <span className="whitespace-nowrap font-mono text-[11.5px] text-muted-foreground sm:text-[12px]">
                        {formatTimeAgo(activity.createdAt)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5 text-right sm:px-5 sm:py-3.5">
                      {getStatusBadge(activity.status)}
                    </td>

                    {/* Receipt */}
                    <td className="px-3 py-2.5 text-right sm:px-5 sm:py-3.5">
                      {activity.status === 'completed' ? (
                        <a
                          href={`/confirmed/${activity.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] font-medium text-[var(--pave-orange)] hover:underline sm:text-[12.5px]"
                        >
                          View →
                        </a>
                      ) : (
                        <span className="text-[12px] text-muted-foreground sm:text-[12.5px]">—</span>
                      )}
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

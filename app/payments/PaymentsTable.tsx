'use client';

import { Badge } from '@/components/ui/badge';
import {
  DataTableHeader,
  DataTableLoading,
  DataTableEmpty,
  type TableColumn,
} from '@/components/ui/data-table';
import { formatTimeAgo } from '@/lib/api/helpers';
import { useExchangeRates, convertCurrency } from '@/hooks';
import { ShortAddress } from '@/components/ShortAddress';
import { API_ENDPOINTS } from '@/lib/constants';
import type { Payment } from '@/types';

const COLUMNS: TableColumn[] = [
  { key: 'id', label: 'Payment ID' },
  { key: 'payer', label: 'Customer' },
  { key: 'amount', label: 'Amount' },
  { key: 'usdcAmount', label: 'USDC Amount' },
  { key: 'paidWith', label: 'Paid With' },
  { key: 'txId', label: 'TX ID' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
  { key: 'receipt', label: 'Receipt' },
];

function getStatusColor(status: Payment['status']) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'failed':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

interface PaymentsTableProps {
  payments: Payment[];
  loading: boolean;
}

export function PaymentsTable({ payments, loading }: PaymentsTableProps) {
  const { data: exchangeRates } = useExchangeRates();

  return (
    <div
      className="border bg-card shadow-sm animate-fadeup"
      style={{ animationDelay: '0.14s' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <DataTableHeader columns={COLUMNS} />
          <tbody>
            {loading ? (
              <DataTableLoading colSpan={COLUMNS.length} message="Loading payments..." />
            ) : payments.length === 0 ? (
              <DataTableEmpty
                colSpan={COLUMNS.length}
                message="No payments found. Create a checkout link to get started."
              />
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <ShortAddress
                      address={payment.id}
                      startChars={8}
                      endChars={4}
                      showCopy={true}
                      className="text-[11px] text-muted-foreground sm:text-xs"
                    />
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="text-[12.5px] font-medium text-foreground sm:text-sm">{payment.payer.name}</div>
                    <div className="text-[11px] text-muted-foreground sm:text-xs">{payment.payer.email}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[12.5px] font-medium text-foreground sm:px-4 sm:py-3 sm:text-sm">
                    {payment.currency === 'XLM' && exchangeRates && payment.usdcAmount
                      ? `XLM ${convertCurrency(payment.usdcAmount, 'USD', 'XLM', exchangeRates).toFixed(2)}`
                      : `${payment.currency} ${payment.amount.toLocaleString()}`}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[12.5px] text-foreground sm:px-4 sm:py-3 sm:text-sm">
                    USDC {payment.usdcAmount?.toLocaleString() || '0'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[12.5px] text-foreground sm:px-4 sm:py-3 sm:text-sm">{payment.paidWith}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3">
                    {payment.method === 'Stellar Wallet' && payment.stellarTxHash ? (
                      <a
                          href={`${API_ENDPOINTS.STELLAR_EXPLORER_TESTNET}/tx/${payment.stellarTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        <ShortAddress
                          address={payment.stellarTxHash}
                          startChars={8}
                          endChars={6}
                          className="text-[11px] text-[var(--stellar)] sm:text-[11.5px]"
                        />
                      </a>
                    ) : (
                      <ShortAddress
                        address={payment.id}
                        startChars={8}
                        endChars={4}
                        className="text-[11px] text-muted-foreground sm:text-[11.5px]"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[12.5px] text-muted-foreground sm:px-4 sm:py-3 sm:text-sm">
                    {formatTimeAgo(payment.createdAt)}
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    {payment.status === 'completed' ? (
                      <a
                        href={`/confirmed/${payment.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12.5px] font-medium text-[var(--pave-orange)] hover:underline sm:text-sm"
                      >
                        View →
                      </a>
                    ) : (
                      <span className="text-[12.5px] text-muted-foreground sm:text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

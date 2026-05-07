'use client';

import { Badge } from '@/components/ui/badge';
import {
  DataTableHeader,
  DataTableLoading,
  DataTableEmpty,
  type TableColumn,
} from '@/components/ui/data-table';
import { formatTimeAgo } from '@/lib/api/helpers';
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
  return (
    <div
      className="rounded-[14px] border bg-card shadow-sm animate-fadeup"
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
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{payment.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-foreground">{payment.payer.name}</div>
                    <div className="text-xs text-muted-foreground">{payment.payer.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {payment.currency} {payment.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    ${payment.usdcAmount?.toLocaleString() || '0'}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{payment.paidWith}</td>
                  <td className="px-4 py-3">
                    {payment.method === 'Stellar Wallet' && payment.stellarTxHash ? (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${payment.stellarTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11.5px] text-[var(--stellar)] hover:underline"
                      >
                        {payment.stellarTxHash.slice(0, 8)}…{payment.stellarTxHash.slice(-6)}
                      </a>
                    ) : (
                      <span className="font-mono text-[11.5px] text-muted-foreground">
                        {payment.id.slice(0, 8)}…{payment.id.slice(-4)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatTimeAgo(payment.createdAt)}
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

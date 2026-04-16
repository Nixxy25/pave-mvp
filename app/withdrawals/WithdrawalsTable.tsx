'use client';

import { Badge } from '@/components/ui/badge';
import {
  DataTableHeader,
  DataTableLoading,
  DataTableEmpty,
  type TableColumn,
} from '@/components/ui/data-table';
import type { Withdrawal } from '@/types';

const COLUMNS: TableColumn[] = [
  { key: 'id', label: 'Withdrawal ID' },
  { key: 'amount', label: 'Amount' },
  { key: 'destination', label: 'Destination' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
  { key: 'stellarTx', label: 'Stellar Tx' },
];

function getStatusColor(status: Withdrawal['status']) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'processing':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'failed':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

interface WithdrawalsTableProps {
  withdrawals: Withdrawal[];
  loading: boolean;
}

export function WithdrawalsTable({ withdrawals, loading }: WithdrawalsTableProps) {
  return (
    <div
      className="rounded-[14px] border bg-card shadow-sm animate-fadeup"
      style={{ animationDelay: '0.07s' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <DataTableHeader columns={COLUMNS} />
          <tbody>
            {loading ? (
              <DataTableLoading colSpan={COLUMNS.length} message="Loading withdrawals..." />
            ) : withdrawals.length === 0 ? (
              <DataTableEmpty
                colSpan={COLUMNS.length}
                message="No withdrawals yet. Transfer funds to your bank account to get started."
              />
            ) : (
              withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {withdrawal.id}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    ${withdrawal.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-foreground">
                      {withdrawal.destination.bankName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {withdrawal.destination.accountNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(withdrawal.status)}>{withdrawal.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(withdrawal.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {withdrawal.stellarTxHash ? (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${withdrawal.stellarTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--pave-orange)] hover:underline"
                      >
                        View →
                      </a>
                    ) : (
                      '-'
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

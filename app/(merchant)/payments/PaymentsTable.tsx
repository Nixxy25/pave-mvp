'use client';

import { useState } from 'react';
import { Fragment } from 'react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataTableEmpty, DataTableHeader, DataTableLoading, type TableColumn } from '@/components/ui/data-table';
import { networkLabel, stellarTransactionUrl } from '@/lib/stellar-explorer';
import { ShortAddress } from '@/components/ShortAddress';
import { getMerchantTransaction } from '@/features/merchant/api/ledger';
import type { MerchantFinancialTransaction } from '@/features/merchant/types/ledger';

const COLUMNS: TableColumn[] = [
  { key: 'id', label: 'Payment ID' },
  { key: 'checkout', label: 'Checkout reference' },
  { key: 'customer', label: 'Customer' },
  { key: 'gross', label: 'Invoice amount' },
  { key: 'usdc', label: 'Amount received' },
  { key: 'network', label: 'Network' },
  { key: 'status', label: 'Status' },
  { key: 'hash', label: 'Transaction' },
  { key: 'date', label: 'Payment date' },
  { key: 'details', label: 'Details' },
];

interface PaymentsTableProps {
  payments: MerchantFinancialTransaction[];
  loading: boolean;
}

function amount(value: number | null): string {
  return value === null ? '—' : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
}

export function PaymentsTable({ payments, loading }: PaymentsTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, MerchantFinancialTransaction>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  async function toggleDetails(paymentId: string) {
    if (expanded === paymentId) {
      setExpanded(null);
      setDetailError(null);
      return;
    }
    setExpanded(paymentId);
    setDetailError(null);
    if (details[paymentId]) return;
    setDetailLoading(paymentId);
    try {
      const payment = await getMerchantTransaction(paymentId);
      setDetails((current) => ({ ...current, [paymentId]: payment }));
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'Payment details are unavailable.');
    } finally {
      setDetailLoading(null);
    }
  }

  return (
    <div className="max-h-[calc(100vh-280px)] overflow-hidden border bg-card">
      <div className="max-h-[calc(100vh-280px)] overflow-auto">
        <table className="w-full text-sm">
          <DataTableHeader columns={COLUMNS} />
          <tbody>
            {loading ? (
              <DataTableLoading colSpan={COLUMNS.length} message="Loading merchant transactions..." />
            ) : payments.length === 0 ? (
              <DataTableEmpty colSpan={COLUMNS.length} message="No transactions match your filters." />
            ) : payments.map((payment) => (
              <Fragment key={payment.paymentId}>
                <tr className="border-b transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <ShortAddress address={payment.paymentId} startChars={8} endChars={4} showCopy />
                  </td>
                  <td className="px-4 py-3">
                    {payment.checkoutReference
                      ? <ShortAddress address={payment.checkoutReference} startChars={8} endChars={4} />
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-text-primary">{payment.customerName}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{payment.grossCurrency} {payment.grossAmount.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {payment.assetAmount === null ? '—' : `${payment.assetCode} ${amount(payment.assetAmount)}`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{networkLabel(payment.network)}</td>
                  <td className="px-4 py-3"><StatusBadge status={payment.status} /></td>
                  <td className="px-4 py-3">
                    {payment.transactionHash ? (
                      <a
                        href={stellarTransactionUrl(payment.network, payment.transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-status-info hover:underline"
                      >
                        <ShortAddress address={payment.transactionHash} startChars={7} endChars={5} />
                      </a>
                    ) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-muted">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      aria-expanded={expanded === payment.paymentId}
                      onClick={() => void toggleDetails(payment.paymentId)}
                      className="font-medium text-[var(--pave-orange)] hover:underline"
                    >
                      {expanded === payment.paymentId ? 'Hide' : 'View'}
                    </button>
                  </td>
                </tr>
                {expanded === payment.paymentId && (
                  <tr className="border-b bg-muted/30">
                    <td colSpan={COLUMNS.length} className="px-5 py-4 text-sm">
                      {detailLoading === payment.paymentId ? (
                        <p className="text-text-muted">Loading verified payment details…</p>
                      ) : detailError ? (
                        <p role="alert" className="text-status-failed">{detailError}</p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          <div><strong className="font-medium text-text-secondary">Payment status:</strong> {(details[payment.paymentId] ?? payment).status}</div>
                          <div><strong className="font-medium text-text-secondary">Checkout:</strong> {(details[payment.paymentId] ?? payment).checkoutReference ?? 'Unavailable'}</div>
                          <div><strong className="font-medium text-text-secondary">Invoice:</strong> {payment.grossCurrency} {payment.grossAmount.toLocaleString()}</div>
                          <div><strong className="font-medium text-text-secondary">Transaction:</strong> {payment.transactionHash ?? 'Unavailable'}</div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { getPayments } from '@/lib/api';
import { usePayments } from '@/hooks/usePayments';
import type { Payment } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataTableHeader, DataTableLoading, DataTableEmpty, type TableColumn } from '@/components/ui/data-table';

const PAYMENT_COLUMNS: TableColumn[] = [
  { key: 'id', label: 'Payment ID' },
  { key: 'payer', label: 'Customer' },
  { key: 'amount', label: 'Amount' },
  { key: 'usdcAmount', label: 'USDC Amount' },
  { key: 'paidWith', label: 'Paid With' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
];

export default function PaymentsPage() {
  const { refetch } = usePayments();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const loadPayments = async () => {
    setLoading(true);
    const data = await getPayments({
      status: statusFilter !== 'all' ? statusFilter as any : undefined,
      search: searchQuery,
    });
    setPayments(data);
    setLoading(false);
  };

  const getStatusColor = (status: Payment['status']) => {
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
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 pb-20 sm:px-7 sm:py-8">
      <div className="mb-6 animate-fadeup">
        <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          Payments
        </div>
        <h1 className="font-serif text-[24px] font-light italic leading-tight tracking-tight text-foreground sm:text-[27px]">
          Payment History
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          All payments received through Pave Checkout and API
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 animate-fadeup sm:flex-row" style={{ animationDelay: '0.07s' }}>
        <Input
          placeholder="Search by payer name or payment ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-md"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={loadPayments} variant="outline" className="w-full sm:w-auto">
          Apply Filters
        </Button>
      </div>

      {/* Payments Table */}
      <div className="rounded-[14px] border bg-card shadow-sm animate-fadeup" style={{ animationDelay: '0.14s' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <DataTableHeader columns={PAYMENT_COLUMNS} />
            <tbody>
              {loading ? (
                <DataTableLoading colSpan={PAYMENT_COLUMNS.length} message="Loading payments..." />
              ) : payments.length === 0 ? (
                <DataTableEmpty 
                  colSpan={PAYMENT_COLUMNS.length} 
                  message="No payments found. Create a checkout link to get started."
                />
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {payment.id}
                    </td>
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
                    <td className="px-4 py-3 text-sm text-foreground">
                      {payment.paidWith}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

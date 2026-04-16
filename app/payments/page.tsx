'use client';

import { useEffect, useState } from 'react';
import { getPayments } from '@/lib/api';
import { PaymentsFilters } from './PaymentsFilters';
import { PaymentsTable } from './PaymentsTable';
import type { Payment } from '@/types';

export default function PaymentsPage() {
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
      status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
      search: searchQuery,
    });
    setPayments(data);
    setLoading(false);
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

      <PaymentsFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onApply={loadPayments}
      />

      <PaymentsTable payments={payments} loading={loading} />
    </div>
  );
}

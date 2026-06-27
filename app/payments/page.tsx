'use client';

import { useState } from 'react';
import { usePayments, useDebounce } from '@/hooks';
import { PaymentsFilters } from './PaymentsFilters';
import { PaymentsTable } from './PaymentsTable';
import type { PaymentStatus } from '@/types';

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Debounce search query to avoid excessive re-fetches
  const debouncedSearch = useDebounce(searchQuery, 400);
  
  const { payments, loading } = usePayments({
    status: statusFilter !== 'all' ? (statusFilter as PaymentStatus) : undefined,
    search: debouncedSearch,
  });

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
      />

      <PaymentsTable payments={payments} loading={loading} />
    </div>
  );
}

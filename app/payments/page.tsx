'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePayments } from '@/hooks';
import { PaymentsFilters } from './PaymentsFilters';
import { PaymentsTable } from './PaymentsTable';
import type { PaymentStatus } from '@/types';

export default function PaymentsPage() {
  const { isAuthenticated, login } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { payments, loading, refetch } = usePayments({
    status: statusFilter !== 'all' ? (statusFilter as PaymentStatus) : undefined,
    search: searchQuery,
  });

  const handleRefresh = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    refetch();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--pave-orange)]" />
      </div>
    );
  }

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
        onApply={handleRefresh}
      />

      <PaymentsTable payments={payments} loading={loading} />
    </div>
  );
}

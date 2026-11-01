'use client';

import { useState } from 'react';
import { useAuth } from '@/features/merchant/auth/AuthContext';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useLedgerTransactions } from '@/features/merchant/hooks/useLedgerTransactions';
import { PageContainer, PageHeader } from '@/components/shared/PageLayout';
import { PaymentsFilters } from './PaymentsFilters';
import { PaymentsTable } from './PaymentsTable';

export default function PaymentsPage() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const { data, loading, error } = useLedgerTransactions({
    enabled: isAuthenticated,
    page,
    status: statusFilter,
    search: debouncedSearch,
  });

  function updateSearch(value: string) {
    setPage(1);
    setSearchQuery(value);
  }

  function updateStatus(value: string) {
    setPage(1);
    setStatusFilter(value);
  }

  return (
    <PageContainer>
      <PageHeader
        className="animate-fadeup"
        title="Payment history"
        description="Verified USDC ledger payments and clearly labeled historical records"
      />

      <PaymentsFilters
        searchQuery={searchQuery}
        setSearchQuery={updateSearch}
        statusFilter={statusFilter}
        setStatusFilter={updateStatus}
      />

      {error ? (
        <div role="alert" className="border border-status-failed/30 bg-status-failed-bg p-4 text-sm text-status-failed">
          {error.message}
        </div>
      ) : (
        <>
          <PaymentsTable payments={data?.rows ?? []} loading={loading} />
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-text-muted">
              {data?.total ?? 0} payments · Page {data?.page ?? page} of {data?.totalPages ?? 1}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="border bg-card px-3 py-1.5 text-text-secondary transition-colors hover:bg-muted hover:text-text-primary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(data?.totalPages ?? current, current + 1))}
                disabled={loading || page >= (data?.totalPages ?? 1)}
                className="border bg-card px-3 py-1.5 text-text-secondary transition-colors hover:bg-muted hover:text-text-primary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}

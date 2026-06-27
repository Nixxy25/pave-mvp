import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/fetch-api';
import type { Payment, PaymentStatus } from '@/types';

function rowToPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    status: row.status as Payment['status'],
    payer: {
      name: row.payer_name as string,
      email: row.payer_email as string | undefined,
    },
    amount: row.amount as number,
    currency: row.currency as string,
    usdcAmount: row.usdc_amount as number | undefined,
    paidWith: row.paid_with as string | undefined,
    settledAmount: row.settled_amount as number,
    settledCurrency: row.settled_currency as string,
    method: row.method as Payment['method'],
    source: row.source as Payment['source'],
    stellarTxHash: row.stellar_tx_hash as string | undefined,
    description: row.description as string | undefined,
    createdAt: row.created_at as string,
    settledAt: row.settled_at as string | undefined,
  };
}

export function usePayments(filters?: { status?: PaymentStatus; search?: string }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ type: 'list' });
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      
      const res = await authFetch(`/api/payments?${params}`);
      if (!res.ok) throw new Error('Failed to fetch payments');
      const { data } = await res.json();
      setPayments((data || []).map(rowToPayment));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.status, filters?.search]);

  return { payments, loading, error, refetch: loadPayments };
}

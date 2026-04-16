import { useEffect, useState } from 'react';
import { getPayments } from '@/lib/api';
import type { Payment } from '@/types';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPayments();
      setPayments(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  return { payments, loading, error, refetch: loadPayments };
}

import { useEffect, useState } from 'react';
import { getWithdrawals } from '@/lib/api';
import type { Withdrawal } from '@/types';

export function useWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWithdrawals();
      setWithdrawals(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  return { withdrawals, loading, error, refetch: loadWithdrawals };
}

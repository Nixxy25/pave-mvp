import { useEffect, useState } from 'react';
import { getBalance } from '@/lib/api';
import type { BalanceData } from '@/types';

export function useBalance() {
  const [balance, setBalance] = useState<BalanceData>({ usdc: 0, ngn: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBalance();
      setBalance(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  return { balance, loading, error, refetch: loadBalance };
}


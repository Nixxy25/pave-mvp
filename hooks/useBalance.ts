import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/fetch-api';
import type { BalanceData, Withdrawal } from '@/types';
import { getUserData } from '@/lib/api/helpers';

export function useBalance() {
  const [balance, setBalance] = useState<BalanceData>({ usdc: 0, ngn: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch('/api/payments?type=balance');
      if (!res.ok) throw new Error('Failed to fetch balance');
      const { totalIn, usdToNgnRate } = await res.json();

      // Subtract localStorage-based withdrawals
      const withdrawals = await getUserData<Withdrawal[]>('withdrawals', []);
      const totalOut = withdrawals
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.amount, 0);

      const usdc = Math.max(0, totalIn - totalOut);
      setBalance({ usdc, ngn: parseFloat((usdc * usdToNgnRate).toFixed(2)) });
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

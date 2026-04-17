import { CONVERSION_RATES } from '../constants';
import { authFetch } from '../fetch-api';
import { getUserData } from './helpers';
import type { BalanceData, Withdrawal } from '@/types';

export async function getBalance(): Promise<BalanceData> {
  const res = await authFetch('/api/payments?type=balance');
  if (!res.ok) return { usdc: 0, ngn: 0 };

  const { totalIn, usdToNgnRate } = await res.json();

  const withdrawals = await getUserData<Withdrawal[]>('withdrawals', []);
  const totalOut = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  const usdc = Math.max(0, totalIn - totalOut);
  return { usdc, ngn: parseFloat((usdc * usdToNgnRate).toFixed(2)) };
}

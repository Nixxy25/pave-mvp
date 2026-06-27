import { authFetch } from '../fetch-api';
import type { BalanceData } from '@/types';

export async function getBalance(): Promise<BalanceData> {
  const balanceRes = await authFetch('/api/payments?type=balance');

  if (!balanceRes.ok) return { usdc: 0, ngn: 0 };

  const { totalIn, usdToNgnRate } = await balanceRes.json();

  // Withdrawals coming soon - for now, balance = total payments
  const totalOut = 0;

  // Use live rate from API (fallback to 1605 already handled server-side)
  const ngnRate = usdToNgnRate ?? 1605;
  const usdc = Math.max(0, totalIn - totalOut);
  return { usdc, ngn: parseFloat((usdc * ngnRate).toFixed(2)) };
}


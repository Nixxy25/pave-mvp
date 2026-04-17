import { authFetch } from '../fetch-api';
import type { AccountStats } from '@/types';

export async function getStats(): Promise<AccountStats> {
  const res = await authFetch('/api/payments?type=stats');
  if (!res.ok) {
    return {
      totalVolume: 0, paymentCount: 0, conversionRate: 0,
      paveFee: 0, stellarFees: 0,
      period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }
  return res.json();
}

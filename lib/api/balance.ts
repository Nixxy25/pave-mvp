import { CONVERSION_RATES } from '../constants';
import { supabase } from '../supabase';
import { getCurrentUserId, getUserData } from './helpers';
import type { BalanceData, Withdrawal } from '@/types';

export async function getBalance(): Promise<BalanceData> {
  const userId = await getCurrentUserId();
  if (!userId) return { usdc: 0, ngn: 0 };

  // Sum completed payments from Supabase
  const { data: paymentsData } = await supabase
    .from('payments')
    .select('usdc_amount')
    .eq('merchant_id', userId)
    .eq('status', 'completed');

  const totalIn = (paymentsData || []).reduce(
    (sum: number, p: { usdc_amount?: number }) => sum + (p.usdc_amount || 0),
    0,
  );

  // Subtract withdrawals (stored in localStorage)
  const withdrawals = await getUserData<Withdrawal[]>('withdrawals', []);
  const totalOut = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  const usdc = Math.max(0, totalIn - totalOut);
  const usdToNgnRate = CONVERSION_RATES['USD']?.['NGN'] || 1605;
  return { usdc, ngn: parseFloat((usdc * usdToNgnRate).toFixed(2)) };
}

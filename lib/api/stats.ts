import { supabase } from '../supabase';
import { getCurrentUserId } from './helpers';
import type { AccountStats } from '@/types';

export async function getStats(): Promise<AccountStats> {
  const userId = await getCurrentUserId();
  const { data } = userId
    ? await supabase
        .from('payments')
        .select('usdc_amount, status')
        .eq('merchant_id', userId)
    : { data: [] };

  const completed = (data || []).filter((p: { status: string }) => p.status === 'completed');
  const totalVolume = completed.reduce(
    (sum: number, p: { usdc_amount?: number }) => sum + (p.usdc_amount || 0),
    0,
  );
  const paveFee = totalVolume * 0.014;

  return {
    totalVolume,
    paymentCount: completed.length,
    conversionRate: completed.length > 0 ? 97.8 : 0,
    paveFee,
    stellarFees: completed.length * 0.001,
    period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
}

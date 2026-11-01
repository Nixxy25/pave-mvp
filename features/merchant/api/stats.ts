import { getMerchantLedgerData } from '@/features/merchant/api/ledger';
import type { AccountStats } from '@/types';

export async function getStats(): Promise<AccountStats> {
  const data = await getMerchantLedgerData();
  return {
    totalVolume: Number(data.totalReceived),
    paymentCount: data.totalPaymentCount,
    period: 'Lifetime · verified payments',
  };
}

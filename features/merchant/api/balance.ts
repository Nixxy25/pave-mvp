import { getMerchantLedgerData } from '@/features/merchant/api/ledger';
import type { BalanceData } from '@/types';

export async function getBalance(): Promise<BalanceData> {
  const data = await getMerchantLedgerData();
  return { usdc: Number(data.totalReceived), ngn: 0 };
}

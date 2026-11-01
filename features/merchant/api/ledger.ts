import { authFetch } from '@/lib/fetch-api';
import type {
  MerchantFinancialTransaction,
  MerchantNetworkBalance,
  MerchantTransactionPage,
} from '@/features/merchant/types/ledger';

export interface MerchantLedgerData {
  wallet: { status: string } | null;
  paymentsToday: number | null;
  paymentsYesterday: number | null;
  networks: MerchantNetworkBalance[];
  totalReceived: string;
  totalPaymentCount: number;
}

export async function getMerchantLedgerData(): Promise<MerchantLedgerData> {
  const response = await authFetch('/api/merchant/ledger-balance');
  if (!response.ok) throw new Error('Ledger balances are unavailable.');
  const payload = await response.json() as { data: MerchantLedgerData };
  return payload.data;
}

export async function getMerchantTransactions(options: {
  page?: number;
  status?: string;
  search?: string;
} = {}): Promise<MerchantTransactionPage> {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    status: options.status ?? 'all',
  });
  if (options.search) params.set('search', options.search);

  const response = await authFetch(`/api/merchant/transactions?${params}`);
  if (!response.ok) throw new Error('Merchant transactions are unavailable.');
  const payload = await response.json() as { data: MerchantTransactionPage };
  return payload.data;
}

export async function getMerchantTransaction(id: string): Promise<MerchantFinancialTransaction> {
  const response = await authFetch(`/api/merchant/transactions/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(response.status === 404 ? 'Payment not found.' : 'Payment details are unavailable.');
  const payload = await response.json() as { data: MerchantFinancialTransaction };
  return payload.data;
}

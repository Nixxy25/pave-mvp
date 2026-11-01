import 'server-only';

import { formatUsdcUnits } from '@/features/customer/server/payment-sessions';
import type {
  MerchantNetworkBalance,
  MerchantTransactionPage,
} from '@/features/merchant/types/ledger';
import { reportingDayBounds } from '@/features/merchant/server/reporting-day';
import { supabase } from '@/lib/supabase/server';

const PAGE_SIZE = 25;

// Verified payments today and yesterday, using the Lagos reporting day.
async function getPaymentActivityMetrics(merchantId: string) {
  const { startOfToday, startOfYesterday } = reportingDayBounds();
  const { data, error } = await supabase.rpc('get_merchant_payment_activity', {
    p_merchant_id: merchantId,
    p_today_start: startOfToday.toISOString(),
    p_yesterday_start: startOfYesterday.toISOString(),
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) {
    console.error('[merchant-ledger] Activity metrics unavailable:', error?.message ?? 'no result');
    return { paymentsToday: null, paymentsYesterday: null };
  }
  return { paymentsToday: Number(row.result_today), paymentsYesterday: Number(row.result_yesterday) };
}

export async function getMerchantLedgerBalances(merchantId: string) {
  const [merchantResult, ledgerResult, walletResult, metrics] = await Promise.all([
    supabase.from('merchants').select('privy_user_id').eq('privy_user_id', merchantId).maybeSingle(),
    supabase.rpc('get_merchant_financial_summary', { p_merchant_id: merchantId }),
    supabase.rpc('get_merchant_wallet', { p_merchant_id: merchantId, p_family: 'stellar' }),
    getPaymentActivityMetrics(merchantId),
  ]);

  if (merchantResult.error || ledgerResult.error || walletResult.error) {
    console.error(
      '[merchant-ledger] Financial summary unavailable:',
      (merchantResult.error ?? ledgerResult.error ?? walletResult.error)?.message,
    );
    throw new Error('Merchant financial information is unavailable.');
  }
  if (!merchantResult.data) return null;

  const rows = (ledgerResult.data ?? []) as Array<{
    result_network: string;
    result_display_name: string;
    result_received_units_1e7: string | number;
    result_payment_count: string | number;
  }>;
  const wallet = (walletResult.data ?? [])[0] as { result_address: string; result_status: string } | undefined;

  const networks = rows.map((row): MerchantNetworkBalance => ({
    network: row.result_network,
    displayName: row.result_display_name,
    received: formatUsdcUnits(row.result_received_units_1e7),
    paymentCount: Number(row.result_payment_count),
  }));
  const totalUnits = rows.reduce((sum, row) => sum + BigInt(row.result_received_units_1e7), BigInt(0));

  return {
    // The permanent address stays server-side; merchants only see readiness.
    wallet: wallet ? { status: wallet.result_status } : null,
    paymentsToday: metrics.paymentsToday,
    paymentsYesterday: metrics.paymentsYesterday,
    networks,
    totalReceived: formatUsdcUnits(totalUnits.toString()),
    totalPaymentCount: networks.reduce((sum, item) => sum + item.paymentCount, 0),
  };
}

export async function getMerchantFinancialTransactions(
  merchantId: string,
  options: { page?: number; status?: string; search?: string } = {},
): Promise<MerchantTransactionPage> {
  const requestedPage = Number.isSafeInteger(options.page) && (options.page ?? 0) > 0
    ? Math.min(options.page!, 100000)
    : 1;
  const search = (options.search ?? '').trim().slice(0, 100);
  const status = options.status && options.status !== 'all' ? options.status : null;

  const { data, error } = await supabase.rpc('list_merchant_financial_transactions', {
    p_merchant_id: merchantId,
    p_page: requestedPage,
    p_page_size: PAGE_SIZE,
    p_status: status,
    p_search: search || null,
  });

  if (error) {
    console.error('[merchant-ledger] Transaction query failed:', error.message);
    throw new Error('Merchant transactions are unavailable.');
  }

  const rows = (data ?? []) as Array<{
    result_payment_id: string;
    result_checkout_reference: string | null;
    result_customer_name: string | null;
    result_gross_amount: string | number;
    result_gross_currency: string;
    result_network: string | null;
    result_asset_code: string;
    result_asset_amount_units_1e7: string | number | null;
    result_status: string;
    result_transaction_hash: string | null;
    result_payment_date: string;
    result_total_count: string | number;
  }>;

  const total = Number(rows[0]?.result_total_count ?? 0);
  return {
    rows: rows.map((row) => ({
      paymentId: row.result_payment_id,
      checkoutReference: row.result_checkout_reference,
      customerName: row.result_customer_name || 'Customer',
      grossAmount: Number(row.result_gross_amount),
      grossCurrency: row.result_gross_currency,
      network: row.result_network,
      assetCode: row.result_asset_code,
      assetAmount: row.result_asset_amount_units_1e7 === null ? null : Number(formatUsdcUnits(row.result_asset_amount_units_1e7)),
      status: row.result_status,
      transactionHash: row.result_transaction_hash,
      paymentDate: row.result_payment_date,
    })),
    page: requestedPage,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

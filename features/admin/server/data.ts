import 'server-only';

import { supabase } from '@/lib/supabase/server';

const PAGE_SIZE = 25;
const MAX_SEARCH_LENGTH = 100;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AdminPageParams {
  page?: number;
  search?: string;
  status?: string;
}

function boundedPage(page: number | undefined): number {
  return Number.isSafeInteger(page) && page && page > 0 ? page : 1;
}

function safeSearch(search: string | undefined): string {
  return (search ?? '')
    .trim()
    .slice(0, MAX_SEARCH_LENGTH)
    .replace(/[%,()]/g, '')
    .replace(/[\r\n]/g, ' ');
}

function throwQueryError(context: string, error: { message: string } | null): void {
  if (error) {
    console.error(`[admin] ${context}: ${error.message}`);
    throw new Error(`Unable to load ${context}.`);
  }
}

export async function getAdminOverview() {
  const [total, completed, pending, failed, expired, merchants, recent] = await Promise.all([
    supabase.from('payments').select('id', { count: 'exact', head: true }),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'expired'),
    supabase.from('merchants').select('privy_user_id', { count: 'exact', head: true }),
    supabase
      .from('payments')
      .select('id, merchant_id, payer_name, amount, currency, usdc_amount, paid_with, method, status, stellar_tx_hash, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  throwQueryError('overview payment count', total.error);
  throwQueryError('overview completed count', completed.error);
  throwQueryError('overview pending count', pending.error);
  throwQueryError('overview failed count', failed.error);
  throwQueryError('overview expired count', expired.error);
  throwQueryError('overview merchant count', merchants.error);
  throwQueryError('recent transactions', recent.error);

  const merchantIds = [...new Set((recent.data ?? []).map((payment) => payment.merchant_id))];
  const merchantNames = new Map<string, string>();
  if (merchantIds.length) {
    const { data, error } = await supabase
      .from('merchants')
      .select('privy_user_id, business_name, full_name')
      .in('privy_user_id', merchantIds);
    throwQueryError('recent transaction merchants', error);
    for (const merchant of data ?? []) {
      merchantNames.set(
        merchant.privy_user_id,
        merchant.business_name || merchant.full_name || 'Unnamed merchant',
      );
    }
  }

  return {
    counts: {
      total: total.count ?? 0,
      completed: completed.count ?? 0,
      pending: pending.count ?? 0,
      failed: failed.count ?? 0,
      expired: expired.count ?? 0,
      merchants: merchants.count ?? 0,
    },
    recent: (recent.data ?? []).map((payment) => ({
      ...payment,
      merchant_name: merchantNames.get(payment.merchant_id) ?? 'Merchant unavailable',
    })),
  };
}

export async function getAdminTransactions(params: AdminPageParams = {}) {
  const page = boundedPage(params.page);
  const search = safeSearch(params.search);
  const status = params.status && ['completed', 'pending', 'failed', 'expired'].includes(params.status)
    ? params.status
    : '';
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('payments')
    .select('id, merchant_id, payer_name, payer_email, amount, currency, usdc_amount, paid_with, method, source, status, stellar_tx_hash, created_at, description', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (status) query = query.eq('status', status);
  if (search) {
    if (UUID_PATTERN.test(search)) {
      query = query.eq('id', search);
    } else if (/^[0-9a-f]{64}$/i.test(search)) {
      query = query.eq('stellar_tx_hash', search);
    } else {
      query = query.or(`payer_name.ilike.%${search}%,merchant_id.ilike.%${search}%`);
    }
  }

  const { data, error, count } = await query;
  throwQueryError('transactions', error);

  const merchantIds = [...new Set((data ?? []).map((payment) => payment.merchant_id))];
  const merchantNames = new Map<string, { name: string; email: string }>();
  if (merchantIds.length) {
    const result = await supabase
      .from('merchants')
      .select('privy_user_id, business_name, full_name, email')
      .in('privy_user_id', merchantIds);
    throwQueryError('transaction merchants', result.error);
    for (const merchant of result.data ?? []) {
      merchantNames.set(merchant.privy_user_id, {
        name: merchant.business_name || merchant.full_name || 'Unnamed merchant',
        email: merchant.email,
      });
    }
  }

  return {
    rows: (data ?? []).map((payment) => ({
      ...payment,
      merchant: merchantNames.get(payment.merchant_id) ?? null,
    })),
    page,
    pageSize: PAGE_SIZE,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

export async function getAdminTransaction(id: string) {
  if (!UUID_PATTERN.test(id)) return null;
  const { data, error } = await supabase
    .from('payments')
    .select('id, merchant_id, checkout_link_id, payer_name, payer_email, amount, currency, usdc_amount, paid_with, method, source, status, stellar_tx_hash, description, created_at')
    .eq('id', id)
    .maybeSingle();
  throwQueryError('transaction details', error);
  if (!data) return null;

  const [merchantResult, checkoutResult] = await Promise.all([
    supabase
      .from('merchants')
      .select('privy_user_id, full_name, business_name, email, stellar_address, created_at')
      .eq('privy_user_id', data.merchant_id)
      .maybeSingle(),
    data.checkout_link_id
      ? supabase
          .from('checkout_links')
          .select('id, description, amount, currency, status, created_at, expires_at')
          .eq('id', data.checkout_link_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  throwQueryError('transaction merchant', merchantResult.error);
  throwQueryError('transaction checkout link', checkoutResult.error);

  return { ...data, merchant: merchantResult.data, checkout_link: checkoutResult.data };
}

// Wallets now live in merchant_wallets; merchants.stellar_address is a legacy column that is empty for new merchants.
async function getStellarWalletAddresses(merchantIds: string[]) {
  if (!merchantIds.length) return new Map<string, string>();
  const { data, error } = await supabase.rpc('get_merchant_wallet_addresses', { p_merchant_ids: merchantIds });
  throwQueryError('merchant wallets', error);
  return new Map(
    ((data ?? []) as Array<{ result_merchant_id: string; result_address: string }>)
      .map((w) => [w.result_merchant_id, w.result_address] as const),
  );
}

export async function getAdminMerchants(params: AdminPageParams = {}) {
  const page = boundedPage(params.page);
  const search = safeSearch(params.search);
  const from = (page - 1) * PAGE_SIZE;
  let query = supabase
    .from('merchants')
    .select('privy_user_id, email, full_name, business_name, stellar_address, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,business_name.ilike.%${search}%,email.ilike.%${search}%,privy_user_id.ilike.%${search}%`,
    );
  }

  const { data, error, count } = await query;
  throwQueryError('merchants', error);
  const rows = data ?? [];

  const wallets = await getStellarWalletAddresses(rows.map((m) => m.privy_user_id));
  const activity = await Promise.all(rows.map(async (merchant) => {
    const result = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchant.privy_user_id);
    throwQueryError('merchant payment activity', result.error);
    return [merchant.privy_user_id, result.count ?? 0] as const;
  }));

  return {
    rows: rows.map((merchant) => ({
      ...merchant,
      stellar_address: wallets.get(merchant.privy_user_id) || merchant.stellar_address,
      payment_count: new Map(activity).get(merchant.privy_user_id) ?? 0,
    })),
    page,
    pageSize: PAGE_SIZE,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

export async function getAdminMerchant(id: string, params: AdminPageParams = {}) {
  const page = boundedPage(params.page);
  const from = (page - 1) * PAGE_SIZE;
  const merchantResult = await supabase
    .from('merchants')
    .select('privy_user_id, email, full_name, business_name, stellar_address, created_at')
    .eq('privy_user_id', id)
    .maybeSingle();
  throwQueryError('merchant details', merchantResult.error);
  if (!merchantResult.data) return null;
  const wallets = await getStellarWalletAddresses([id]);

  const [payments, completed] = await Promise.all([
    supabase
      .from('payments')
      .select('id, merchant_id, payer_name, amount, currency, usdc_amount, method, status, stellar_tx_hash, created_at', { count: 'exact' })
      .eq('merchant_id', id)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
    supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', id)
      .eq('status', 'completed'),
  ]);
  throwQueryError('merchant payments', payments.error);
  throwQueryError('merchant completed payment count', completed.error);

  return {
    merchant: { ...merchantResult.data, stellar_address: wallets.get(id) || merchantResult.data.stellar_address },
    payments: {
      rows: payments.data ?? [],
      page,
      pageSize: PAGE_SIZE,
      total: payments.count ?? 0,
      totalPages: Math.max(1, Math.ceil((payments.count ?? 0) / PAGE_SIZE)),
    },
    completedCount: completed.count ?? 0,
  };
}

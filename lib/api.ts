import { getCurrentUser as getCognitoUser, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import { CONVERSION_RATES } from './constants';
import { supabase } from './supabase';
import type {
  Payment,
  CreatePaymentData,
  PaymentFilters,
  CheckoutLink,
  Withdrawal,
  CreateWithdrawalData,
  BalanceData,
  AccountStats,
  Merchant,
  APILog,
  HTTPMethod,
  HTTPStatus,
} from '@/types';

// ─── Helper: Cognito User ─────────────────────────────────────────────────────

async function getCurrentUserId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const user = await getCognitoUser();
    return user.userId;
  } catch {
    return null;
  }
}

// ─── Helper: localStorage (per-user keyed storage) ───────────────────────────

async function getUserData<T>(key: string, defaultValue: T): Promise<T> {
  if (typeof window === 'undefined') return defaultValue;
  const userId = await getCurrentUserId();
  if (!userId) return defaultValue;

  const data = localStorage.getItem(`pave_${key}_${userId}`);
  return data ? JSON.parse(data) : defaultValue;
}

async function setUserData<T>(key: string, value: T): Promise<void> {
  if (typeof window === 'undefined') return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  localStorage.setItem(`pave_${key}_${userId}`, JSON.stringify(value));
}

// ─── Row mappers ─────────────────────────────────────────────────────────────

function rowToCheckoutLink(row: Record<string, unknown>): CheckoutLink {
  return {
    id: row.id as string,
    paymentId: row.id as string,
    url: `${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/${row.id}`,
    amount: row.amount as number,
    currency: row.currency as string,
    description: row.description as string,
    acceptedCurrencies: row.accepted_currencies as string[],
    settlementAsset: row.settlement_asset as string,
    stellarWalletAddress: row.stellar_wallet_address as string | undefined,
    equivalents: (row.equivalents as Record<string, number>) || {},
    expiresAt: row.expires_at as string,
    createdAt: row.created_at as string,
    status: row.status as 'active' | 'expired' | 'completed',
    merchantName: row.merchant_name as string | undefined,
    merchantVerified: row.merchant_verified as boolean | undefined,
  };
}

function rowToPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    status: row.status as Payment['status'],
    payer: {
      name: row.payer_name as string,
      email: row.payer_email as string | undefined,
      country: row.payer_country as string | undefined,
    },
    amount: row.amount as number,
    currency: row.currency as string,
    usdcAmount: row.usdc_amount as number | undefined,
    paidWith: row.paid_with as string | undefined,
    settledAmount: row.settled_amount as number,
    settledCurrency: row.settled_currency as string,
    method: row.method as Payment['method'],
    source: row.source as Payment['source'],
    stellarTxHash: row.stellar_tx_hash as string | undefined,
    description: row.description as string | undefined,
    createdAt: row.created_at as string,
    settledAt: row.settled_at as string | undefined,
  };
}

// ─── Payments (Supabase) ──────────────────────────────────────────────────────

export async function getPayments(filters?: PaymentFilters): Promise<Payment[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  let query = supabase
    .from('payments')
    .select('*')
    .eq('merchant_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.or(`payer_name.ilike.%${filters.search}%,id.ilike.%${filters.search}%`);
  }

  const { data } = await query;
  return (data || []).map(rowToPayment);
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  const { data } = await supabase.from('payments').select('*').eq('id', id).single();
  return data ? rowToPayment(data) : null;
}

// ─── Checkout Links (Supabase) ────────────────────────────────────────────────

export async function getCheckoutLinks(): Promise<CheckoutLink[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data } = await supabase
    .from('checkout_links')
    .select('*')
    .eq('merchant_id', userId)
    .order('created_at', { ascending: false });

  return (data || []).map(rowToCheckoutLink);
}

export async function getCheckoutLinkById(id: string): Promise<CheckoutLink | null> {
  const { data } = await supabase.from('checkout_links').select('*').eq('id', id).single();
  return data ? rowToCheckoutLink(data) : null;
}

export async function createPayment(data: CreatePaymentData): Promise<CheckoutLink> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const conversionRates: Record<string, Record<string, number>> = {
    NGN: { GHS: 0.00427, USD: 0.00062, KES: 0.081, XOF: 0.365 },
    USD: { GHS: 13.7, NGN: 1605, KES: 129.5, XOF: 585 },
    GHS: { NGN: 234, USD: 0.073, KES: 9.45, XOF: 42.7 },
    KES: { NGN: 12.3, USD: 0.0077, GHS: 0.106, XOF: 4.52 },
    XOF: { NGN: 2.74, USD: 0.0017, GHS: 0.0234, KES: 0.221 },
  };

  const equivalents: Record<string, number> = { [data.currency]: data.amount };

  if (conversionRates[data.currency]) {
    for (const [target, rate] of Object.entries(conversionRates[data.currency])) {
      equivalents[target] = parseFloat((data.amount * rate).toFixed(2));
    }
  }

  const attrs = await fetchUserAttributes().catch(() => ({})) as Record<string, string>;
  const merchantName = attrs.nickname || 'Business';
  const merchantPersonName = attrs.name || '';

  const expiresAt = data.expiresInHours
    ? new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: inserted, error } = await supabase
    .from('checkout_links')
    .insert({
      merchant_id: userId,
      merchant_name: merchantName,
      merchant_person_name: merchantPersonName,
      merchant_verified: true,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      accepted_currencies: data.acceptedCurrencies,
      settlement_asset: data.settlementAsset,
      stellar_wallet_address: data.stellarWalletAddress || null,
      equivalents,
      expires_at: expiresAt,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAPICall('POST', '/v1/payments', 201, JSON.stringify(data));

  return rowToCheckoutLink(inserted);
}

export async function getMerchantInfo(checkoutLinkId?: string): Promise<{ name: string; personName: string; country: string; verified: boolean } | null> {
  // For public checkout page: read merchant name from the checkout link row (no auth needed)
  if (checkoutLinkId) {
    const { data } = await supabase
      .from('checkout_links')
      .select('merchant_name, merchant_person_name, merchant_verified')
      .eq('id', checkoutLinkId)
      .single();
    if (data) {
      return {
        name: data.merchant_name || 'Business',
        personName: data.merchant_person_name || '',
        country: 'Nigeria',
        verified: data.merchant_verified ?? true,
      };
    }
    return null;
  }
  // Logged-in dashboard: read from Cognito
  if (typeof window === 'undefined') return null;
  try {
    const attributes = await fetchUserAttributes();
    return {
      name: attributes.nickname || 'Business',
      personName: attributes.name || '',
      country: 'Nigeria',
      verified: true,
    };
  } catch {
    return null;
  }
}

export async function completeCheckoutPayment(data: {
  checkoutLinkId: string;
  customerName: string;
  amount: number;
  currency: string;
  usdcAmount: number;
  description: string;
  paymentMethod: 'mobile_money' | 'card';
}): Promise<{ success: boolean; paymentId: string }> {
  if (typeof window === 'undefined') throw new Error('Cannot complete payment on server');

  // Get merchant_id from the checkout link (public row, no auth needed)
  const { data: linkRow } = await supabase
    .from('checkout_links')
    .select('merchant_id')
    .eq('id', data.checkoutLinkId)
    .single();

  if (!linkRow) throw new Error('Checkout link not found');

  const countryMap: Record<string, string> = {
    GHS: 'GH', KES: 'KE', XOF: 'SN', NGN: 'NG', USD: 'US',
  };

  const stellarTxHash = `${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

  const { data: inserted, error } = await supabase
    .from('payments')
    .insert({
      merchant_id: linkRow.merchant_id,
      checkout_link_id: data.checkoutLinkId,
      payer_name: data.customerName,
      payer_country: countryMap[data.currency] || 'NG',
      amount: data.amount,
      currency: data.currency,
      usdc_amount: data.usdcAmount,
      paid_with: 'Visa Card',
      settled_amount: data.usdcAmount,
      settled_currency: 'USDC',
      method: 'Card',
      source: 'Checkout',
      description: data.description,
      status: 'completed',
      settled_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Mark checkout link as completed
  await supabase
    .from('checkout_links')
    .update({ status: 'completed' })
    .eq('id', data.checkoutLinkId);

  // Update Supabase balance
  const { data: currentBalance } = await supabase
    .from('balances')
    .select('usdc')
    .eq('merchant_id', linkRow.merchant_id)
    .single();

  const newUsdc = (currentBalance?.usdc || 0) + data.usdcAmount;
  const usdToNgnRate = CONVERSION_RATES['USD']?.['NGN'] || 1605;

  await supabase.from('balances').upsert({
    merchant_id: linkRow.merchant_id,
    usdc: newUsdc,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'merchant_id' });

  return { success: true, paymentId: inserted.id };
}

// ─── Withdrawals (localStorage) ───────────────────────────────────────────────

export async function getWithdrawals(): Promise<Withdrawal[]> {
  return getUserData<Withdrawal[]>('withdrawals', []);
}

export async function createWithdrawal(data: CreateWithdrawalData): Promise<Withdrawal> {
  const withdrawals = await getUserData<Withdrawal[]>('withdrawals', []);
  const balance = await getUserData<BalanceData>('balance', { usdc: 0, ngn: 0 });

  if (balance.usdc < data.amount) throw new Error('Insufficient balance');

  const bankAccountId = `bank_${data.bankName.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}`;
  const maskedAccountNumber = data.accountNumber.slice(0, -4).replace(/./g, '•') + data.accountNumber.slice(-4);

  const newWithdrawal: Withdrawal = {
    id: `pout_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    amount: data.amount,
    currency: data.currency,
    destination: {
      id: bankAccountId,
      bankName: data.bankName,
      bankCode: '000',
      accountNumber: maskedAccountNumber,
      accountName: data.accountName,
      country: 'NG',
    },
    narration: data.narration,
    stellarTxHash: `${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
    estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  };

  withdrawals.push(newWithdrawal);
  balance.usdc -= data.amount;

  await setUserData('withdrawals', withdrawals);

  // Update Supabase balance
  const userId2 = await getCurrentUserId();
  if (userId2) {
    const { data: currentBal } = await supabase
      .from('balances')
      .select('usdc')
      .eq('merchant_id', userId2)
      .single();
    const newUsdc = Math.max(0, (currentBal?.usdc || 0) - data.amount);
    await supabase.from('balances').upsert({
      merchant_id: userId2,
      usdc: newUsdc,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'merchant_id' });
  }

  await logAPICall('POST', '/v1/payouts', 201, JSON.stringify(data));

  return newWithdrawal;
}

// ─── Balance & Stats (Supabase) ──────────────────────────────────────────────

export async function getBalance(): Promise<BalanceData> {
  const userId = await getCurrentUserId();
  if (!userId) return { usdc: 0, ngn: 0 };

  const { data } = await supabase
    .from('balances')
    .select('usdc')
    .eq('merchant_id', userId)
    .single();

  const usdc = data?.usdc || 0;
  const usdToNgnRate = CONVERSION_RATES['USD']?.['NGN'] || 1605;
  return { usdc, ngn: parseFloat((usdc * usdToNgnRate).toFixed(2)) };
}

export async function getStats(): Promise<AccountStats> {
  const userId = await getCurrentUserId();
  const { data } = userId
    ? await supabase.from('payments').select('usdc_amount, status').eq('merchant_id', userId)
    : { data: [] };
  const completed = (data || []).filter((p: { status: string }) => p.status === 'completed');
  const totalVolume = completed.reduce((sum: number, p: { usdc_amount?: number }) => sum + (p.usdc_amount || 0), 0);
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

// ─── AWS Cognito / Google — User Profile ──────────────────────────────────────

export async function getUserProfile(): Promise<Merchant> {
  const cognitoUser = await getCognitoUser();
  const userId = cognitoUser.userId;
  const isGoogleUser = cognitoUser.username?.startsWith('google_') || false;

  let email = '';
  let name = '';
  let businessName = '';

  if (isGoogleUser) {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;
    if (idToken?.payload) {
      email = (idToken.payload.email as string) || '';
      name = (idToken.payload.name as string) || '';
    }
    // businessName is saved to Cognito nickname by complete-profile
    const attrs = await fetchUserAttributes();
    businessName = attrs.nickname || '';
  } else {
    const attributes = await fetchUserAttributes();
    email = attributes.email || '';
    name = attributes.name || '';
    businessName = attributes.nickname || '';
  }

  let apiKeys = JSON.parse(localStorage.getItem(`pave_api_keys_${userId}`) || 'null');
  if (!apiKeys) {
    apiKeys = {
      apiKey: `pk_test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      secretKey: `sk_test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      stellarWalletAddress: `G${Math.random().toString(36).substring(2, 15).toUpperCase()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
    };
    localStorage.setItem(`pave_api_keys_${userId}`, JSON.stringify(apiKeys));
  }

  return {
    id: userId,
    name,
    email,
    businessName,
    createdAt: new Date().toISOString(),
    plan: 'Free',
    apiKey: apiKeys.apiKey,
    secretKey: apiKeys.secretKey,
    stellarWallet: apiKeys.stellarWalletAddress,
    stellarWalletAddress: apiKeys.stellarWalletAddress,
    preferences: {
      emailNotifications: true,
      autoWithdrawal: false,
      stellarExplorerLinks: true,
      twoFactorAuth: false,
    },
  } as Merchant;
}


// ─── localStorage — API Logs ──────────────────────────────────────────────────

async function logAPICall(method: string, path: string, status: number, requestBody?: string): Promise<void> {
  const logs = await getUserData<APILog[]>('api_logs', []);

  const validMethods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  const validStatuses: HTTPStatus[] = [200, 201, 400, 401, 404, 422, 500];

  const newLog: APILog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    method: validMethods.includes(method as HTTPMethod) ? (method as HTTPMethod) : 'POST',
    path,
    status: validStatuses.includes(status as HTTPStatus) ? (status as HTTPStatus) : 200,
    duration: Math.floor(Math.random() * 200) + 50,
    timestamp: new Date().toISOString(),
    requestBody,
  };

  logs.unshift(newLog);
  if (logs.length > 100) logs.splice(100);

  await setUserData('api_logs', logs);
}

export async function getAPILogs(): Promise<APILog[]> {
  return getUserData<APILog[]>('api_logs', []);
}

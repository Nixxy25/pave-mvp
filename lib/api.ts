import { getCurrentUser as getCognitoUser, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import { CONVERSION_RATES } from './constants';
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

// ─── Payments (localStorage) ─────────────────────────────────────────────────

export async function getPayments(filters?: PaymentFilters): Promise<Payment[]> {
  let payments = await getUserData<Payment[]>('payments', []);

  if (filters?.status) {
    payments = payments.filter(p => p.status === filters.status);
  }

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    payments = payments.filter(p =>
      p.payer.name.toLowerCase().includes(search) ||
      p.id.toLowerCase().includes(search)
    );
  }

  return payments;
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  const payments = await getUserData<Payment[]>('payments', []);
  return payments.find(p => p.id === id) || null;
}

// ─── Checkout Links (localStorage) ───────────────────────────────────────────

export async function getCheckoutLinks(): Promise<CheckoutLink[]> {
  return getUserData<CheckoutLink[]>('checkout_links', []);
}

export async function getCheckoutLinkById(id: string): Promise<CheckoutLink | null> {
  const links = await getUserData<CheckoutLink[]>('checkout_links', []);
  return links.find(link => link.id === id) || null;
}

export async function createPayment(data: CreatePaymentData): Promise<CheckoutLink> {
  const linkId = `link_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`;

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

  const newLink: CheckoutLink = {
    id: linkId,
    paymentId,
    url: `${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/${linkId}`,
    amount: data.amount,
    currency: data.currency,
    description: data.description,
    acceptedCurrencies: data.acceptedCurrencies,
    settlementAsset: data.settlementAsset,
    equivalents,
    redirectUrl: data.redirectUrl,
    expiresAt: new Date(Date.now() + (data.expiresInHours || 24) * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  const checkoutLinks = await getUserData<CheckoutLink[]>('checkout_links', []);
  checkoutLinks.push(newLink);
  await setUserData('checkout_links', checkoutLinks);

  await logAPICall('POST', '/v1/payments', 201, JSON.stringify(data));

  return newLink;
}

export async function getMerchantInfo(): Promise<{ name: string; country: string; verified: boolean } | null> {
  if (typeof window === 'undefined') return null;
  try {
    const attributes = await fetchUserAttributes();
    return {
      name: attributes.nickname || 'Business',
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
  customerEmail: string;
  amount: number;
  currency: string;
  usdcAmount: number;
  description: string;
  paymentMethod: 'mobile_money' | 'card';
}): Promise<{ success: boolean; paymentId: string }> {
  if (typeof window === 'undefined') throw new Error('Cannot complete payment on server');

  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const countryMap: Record<string, string> = {
    GHS: 'GH', KES: 'KE', XOF: 'SN', NGN: 'NG', USD: 'US',
  };

  const newPayment: Payment = {
    id: paymentId,
    payer: {
      name: data.customerName.trim(),
      email: data.customerEmail.trim(),
      country: countryMap[data.currency] || 'NG',
    },
    amount: data.amount,
    currency: data.currency,
    usdcAmount: data.usdcAmount,
    description: data.description,
    method: data.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Card',
    source: 'Checkout',
    paidWith: data.paymentMethod === 'mobile_money' ? 'MTN Mobile Money' : 'Visa Card',
    stellarTxHash: `${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}`,
    status: 'completed',
    settledAmount: data.usdcAmount,
    settledCurrency: 'USDC',
    createdAt: new Date().toISOString(),
    settledAt: new Date().toISOString(),
  };

  // Save payment and update balance in localStorage
  await setUserData('payments', [...await getUserData<Payment[]>('payments', []), newPayment]);

  const balance = await getUserData<BalanceData>('balance', { usdc: 0, ngn: 0 });
  balance.usdc += data.usdcAmount;
  await setUserData('balance', balance);

  // Mark checkout link as completed
  const links = await getUserData<CheckoutLink[]>('checkout_links', []);
  const linkIndex = links.findIndex(l => l.id === data.checkoutLinkId);
  if (linkIndex !== -1) {
    links[linkIndex].status = 'completed';
    await setUserData('checkout_links', links);
  }

  return { success: true, paymentId: newPayment.id };
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
  await setUserData('balance', balance);

  await logAPICall('POST', '/v1/payouts', 201, JSON.stringify(data));

  return newWithdrawal;
}

// ─── Balance & Stats (localStorage) ──────────────────────────────────────────

export async function getBalance(): Promise<BalanceData> {
  const balance = await getUserData<BalanceData>('balance', { usdc: 0, ngn: 0 });
  const usdToNgnRate = CONVERSION_RATES['USD']?.['NGN'] || 1605;
  balance.ngn = parseFloat((balance.usdc * usdToNgnRate).toFixed(2));
  return balance;
}

export async function getStats(): Promise<AccountStats> {
  const payments = await getUserData<Payment[]>('payments', []);
  const completed = payments.filter(p => p.status === 'completed');
  const totalVolume = completed.reduce((sum, p) => sum + (p.usdcAmount || 0), 0);
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

export async function updateSettings(settings: Partial<Merchant['preferences']>): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const preferences = JSON.parse(localStorage.getItem(`pave_preferences_${userId}`) || '{}');
  localStorage.setItem(`pave_preferences_${userId}`, JSON.stringify({ ...preferences, ...settings }));
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

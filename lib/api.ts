import type {
  Payment,
  CreatePaymentData,
  PaymentFilters,
  CheckoutLink,
  Withdrawal,
  CreateWithdrawalData,
  BankAccount,
  BalanceData,
  AccountStats,
  Merchant,
  APILog,
  WebhookEvent,
  Notification,
  HTTPMethod,
  HTTPStatus,
} from '@/types';
import { CONVERSION_RATES } from './constants';

/**
 * Central API layer using localStorage
 * 
 * All data is stored per user in localStorage
 */

// ============================================================================
// HELPER FUNCTIONS  
// ============================================================================

function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pave_current_user');
}

function getUserData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const userId = getCurrentUserId();
  if (!userId) return defaultValue;
  
  const data = localStorage.getItem(`pave_${key}_${userId}`);
  return data ? JSON.parse(data) : defaultValue;
}

function setUserData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  const userId = getCurrentUserId();
  if (!userId) return;
  
  localStorage.setItem(`pave_${key}_${userId}`, JSON.stringify(value));
}

function getCurrentUser(): Merchant | null {
  if (typeof window === 'undefined') return null;
  const userId = getCurrentUserId();
  if (!userId) return null;
  
  const users = JSON.parse(localStorage.getItem('pave_users') || '[]');
  return users.find((u: any) => u.id === userId) || null;
}

// ============================================================================
// PAYMENTS API
// ============================================================================

export async function getPayments(filters?: PaymentFilters): Promise<Payment[]> {
  let payments = getUserData<Payment[]>('payments', []);
  
  // Apply filters if provided
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
  const payments = await getPayments();
  return payments.find(p => p.id === id) || null;
}

export async function createPayment(data: CreatePaymentData): Promise<CheckoutLink> {
  const payments = getUserData<Payment[]>('payments', []);
  const checkoutLinks = getUserData<CheckoutLink[]>('checkout_links', []);
  
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const linkId = `link_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Currency conversion rates (simplified for MVP)
  const conversionRates: Record<string, Record<string, number>> = {
    'NGN': { 'GHS': 0.00427, 'USD': 0.00062, 'KES': 0.081, 'XOF': 0.365 },
    'USD': { 'GHS': 13.7, 'NGN': 1605, 'KES': 129.5, 'XOF': 585 },
    'GHS': { 'NGN': 234, 'USD': 0.073, 'KES': 9.45, 'XOF': 42.7 },
    'KES': { 'NGN': 12.3, 'USD': 0.0077, 'GHS': 0.106, 'XOF': 4.52 },
    'XOF': { 'NGN': 2.74, 'USD': 0.0017, 'GHS': 0.0234, 'KES': 0.221 },
  };
  
  // Calculate equivalents
  const equivalents: Record<string, number> = {};
  const baseCurrency = data.currency;
  const baseAmount = data.amount;
  
  // Add base currency
  equivalents[baseCurrency] = baseAmount;
  
  // Calculate other currencies
  if (conversionRates[baseCurrency]) {
    Object.entries(conversionRates[baseCurrency]).forEach(([targetCurrency, rate]) => {
      equivalents[targetCurrency] = parseFloat((baseAmount * rate).toFixed(2));
    });
  }
  
  const newPayment: Payment = {
    id: paymentId,
    payer: {
      name: 'Pending',
      email: 'pending@example.com',
      country: 'NG',
    },
    amount: data.amount,
    currency: data.currency,
    usdcAmount: equivalents['USD'] || data.amount,
    paidWith: 'USDC',
    settledAmount: equivalents['USD'] || data.amount,
    settledCurrency: 'USDC',
    method: 'Card',
    source: 'API',
    stellarTxHash: `${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
    settledAt: new Date().toISOString(),
    description: data.description,
  };
  
  const newLink: CheckoutLink = {
    id: linkId,
    paymentId,
    url: `${window.location.origin}/checkout/${linkId}`,
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
  
  checkoutLinks.push(newLink);
  
  setUserData('checkout_links', checkoutLinks);
  
  // Log API call
  logAPICall('POST', '/v1/payments', 201, JSON.stringify(data));
  
  return newLink;
}

export async function getCheckoutLinks(): Promise<CheckoutLink[]> {
  return getUserData<CheckoutLink[]>('checkout_links', []);
}

export async function getCheckoutLinkById(id: string): Promise<CheckoutLink | null> {
  const links = await getCheckoutLinks();
  return links.find(link => link.id === id) || null;
}

// Get merchant info for checkout
export async function getMerchantInfo(): Promise<{ name: string; country: string; verified: boolean; } | null> {
  if (typeof window === 'undefined') return null;
  
  const users = JSON.parse(localStorage.getItem('pave_users') || '[]');
  const merchant = users[0]; // For demo, use first merchant
  
  if (!merchant) return null;
  
  return {
    name: merchant.businessName || 'Business',
    country: merchant.country || 'Nigeria',
    verified: true,
  };
}

// Complete a payment from checkout
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
  if (typeof window === 'undefined') {
    throw new Error('Cannot complete payment on server');
  }
  
  const users = JSON.parse(localStorage.getItem('pave_users') || '[]');
  const merchant = users[0];
  
  if (!merchant) {
    throw new Error('Merchant not found');
  }
  
  const userId = merchant.id;
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Get country code from currency
  const countryMap: Record<string, string> = {
    'GHS': 'GH',
    'KES': 'KE',
    'XOF': 'SN',
    'NGN': 'NG',
    'USD': 'US',
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
  
  // Store payment
  const payments = JSON.parse(localStorage.getItem(`pave_payments_${userId}`) || '[]');
  payments.push(newPayment);
  localStorage.setItem(`pave_payments_${userId}`, JSON.stringify(payments));
  
  // Update balance
  const balance = JSON.parse(localStorage.getItem(`pave_balance_${userId}`) || '{"usdc": 0, "ngn": 0}');
  balance.usdc += data.usdcAmount;
  localStorage.setItem(`pave_balance_${userId}`, JSON.stringify(balance));
  
  // Mark checkout link as completed
  const links = JSON.parse(localStorage.getItem(`pave_checkout_links_${userId}`) || '[]');
  const linkIndex = links.findIndex((l: any) => l.id === data.checkoutLinkId);
  if (linkIndex !== -1) {
    links[linkIndex].status = 'completed';
    localStorage.setItem(`pave_checkout_links_${userId}`, JSON.stringify(links));
  }
  
  return { success: true, paymentId };
}

// ============================================================================
// WITHDRAWALS / PAYOUTS API
// ============================================================================

export async function getWithdrawals(): Promise<Withdrawal[]> {
  return getUserData<Withdrawal[]>('withdrawals', []);
}

export async function createWithdrawal(data: CreateWithdrawalData): Promise<Withdrawal> {
  const withdrawals = getUserData<Withdrawal[]>('withdrawals', []);
  const balance = getUserData<BalanceData>('balance', { usdc: 0, ngn: 0 });
  
  // Check if user has sufficient balance
  if (balance.usdc < data.amount) {
    throw new Error('Insufficient balance');
  }
  
  // Generate bank account ID
  const bankAccountId = `bank_${data.bankName.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}`;
  
  // Mask account number
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
  
  // Update balance
  balance.usdc -= data.amount;
  
  setUserData('withdrawals', withdrawals);
  setUserData('balance', balance);
  
  // Log API call
  logAPICall('POST', '/v1/payouts', 201, JSON.stringify(data));
  
  return newWithdrawal;
}

// ============================================================================
// BALANCE & STATS
// ============================================================================

export async function getBalance(): Promise<BalanceData> {
  const balance = getUserData<BalanceData>('balance', { usdc: 0, ngn: 0 });
  
  // Calculate NGN equivalent using conversion rate
  const usdToNgnRate = CONVERSION_RATES['USD']?.['NGN'] || 1605;
  balance.ngn = parseFloat((balance.usdc * usdToNgnRate).toFixed(2));
  
  return balance;
}

export async function getStats(): Promise<AccountStats> {
  const payments = getUserData<Payment[]>('payments', []);
  const completedPayments = payments.filter(p => p.status === 'completed');
  
  const totalVolume = completedPayments.reduce((sum, p) => sum + (p.usdcAmount || 0), 0);
  const paveFee = totalVolume * 0.014; // 1.4% fee
  
  return {
    totalVolume,
    paymentCount: completedPayments.length,
    conversionRate: completedPayments.length > 0 ? 97.8 : 0,
    paveFee,
    stellarFees: completedPayments.length * 0.001,
    period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
}

// ============================================================================
// USER & ACCOUNT
// ============================================================================

export async function getUserProfile(): Promise<Merchant> {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('No user logged in');
  }
  return user;
}

export async function updateSettings(settings: Partial<Merchant['preferences']>): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;
  
  const users = JSON.parse(localStorage.getItem('pave_users') || '[]');
  const userIndex = users.findIndex((u: any) => u.id === userId);
  
  if (userIndex !== -1) {
    users[userIndex].preferences = {
      ...users[userIndex].preferences,
      ...settings,
    };
    localStorage.setItem('pave_users', JSON.stringify(users));
  }
}

// ============================================================================
// API LOGS
// ============================================================================

function logAPICall(method: string, path: string, status: number, requestBody?: string): void {
  const logs = getUserData<APILog[]>('api_logs', []);
  
  // Only allow valid HTTP methods and statuses
  const validMethods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  const validStatuses: HTTPStatus[] = [200, 201, 400, 401, 404, 422, 500];
  
  const newLog: APILog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    method: validMethods.includes(method as any) ? (method as HTTPMethod) : 'POST',
    path,
    status: validStatuses.includes(status as any) ? (status as HTTPStatus) : 200,
    duration: Math.floor(Math.random() * 200) + 50,
    timestamp: new Date().toISOString(),
    requestBody,
  };
  
  logs.unshift(newLog);
  
  // Keep only last 100 logs
  if (logs.length > 100) {
    logs.splice(100);
  }
  
  setUserData('api_logs', logs);
}

export async function getAPILogs(): Promise<APILog[]> {
  return getUserData<APILog[]>('api_logs', []);
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function getNotifications(): Promise<Notification[]> {
  return getUserData<Notification[]>('notifications', []);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const notifications = getUserData<Notification[]>('notifications', []);
  const notification = notifications.find(n => n.id === id);
  
  if (notification) {
    notification.read = true;
    setUserData('notifications', notifications);
  }
}

export async function createNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<void> {
  const notifications = getUserData<Notification[]>('notifications', []);
  
  const newNotification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  };
  
  notifications.unshift(newNotification);
  
  // Keep only last 50 notifications
  if (notifications.length > 50) {
    notifications.splice(50);
  }
  
  setUserData('notifications', notifications);
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export async function logout(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pave_current_user');
  }
}

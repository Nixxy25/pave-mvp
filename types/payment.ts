export type PaymentStatus = 'pending' | 'routing' | 'settled' | 'failed' | 'completed';
export type PaymentMethod = 'Card' | 'Stellar Wallet' | 'Bank Transfer';
export type PaymentSource = 'Checkout' | 'API';

export interface Payer {
  name: string;
  email?: string;
  location?: string;
  avatar?: string;
  businessType?: string;
}

export interface Payment {
  id: string;
  status: PaymentStatus;
  payer: Payer;
  amount: number;
  currency: string;
  usdcAmount?: number;
  paidWith?: string;
  settledAmount: number;
  settledCurrency: string;
  method: PaymentMethod;
  source: PaymentSource;
  stellarTxHash?: string;
  ledgerSequence?: number;
  settlementPath?: string[];
  settleTime?: number;
  networkFee?: string;
  description?: string;
  createdAt: string;
  settledAt?: string;
}

export interface CreatePaymentData {
  title: string;
  amount: number;
  currency: string;
  description?: string;
  webhookUrl?: string;
  expiresInHours?: number;
  metadata?: Record<string, any>;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface CheckoutLink {
  id: string;
  paymentId: string;
  url: string;
  amount: number;
  currency: string;
  title?: string;
  description: string;
  acceptedCurrencies: string[];
  acceptedPaymentMethods: Array<'crypto' | 'bank_transfer'>;
  settlementAsset: string;
  stellarWalletAddress?: string;
  expiresAt: string;
  createdAt: string;
  status: 'active' | 'expired' | 'completed';
  merchantName?: string;
  merchantVerified?: boolean;
}

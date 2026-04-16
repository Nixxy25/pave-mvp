export type PaymentStatus = 'pending' | 'routing' | 'settled' | 'failed' | 'completed';
export type PaymentMethod = 'Mobile Money' | 'Card' | 'Stellar Wallet';
export type PaymentSource = 'Checkout' | 'API';

export interface Payer {
  name: string;
  email?: string;
  location?: string;
  avatar?: string;
  country?: string;
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
  amount: number;
  currency: string;
  description: string;
  acceptedCurrencies: string[];
  settlementAsset: string;
  stellarWalletAddress?: string;
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
  description: string;
  acceptedCurrencies: string[];
  settlementAsset: string;
  stellarWalletAddress?: string;
  equivalents: Record<string, number>;
  expiresAt: string;
  createdAt: string;
  status: 'active' | 'expired' | 'completed';
  merchantName?: string;
  merchantVerified?: boolean;
}

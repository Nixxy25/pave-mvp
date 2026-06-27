export type KYCStatus = 'pending' | 'verified' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  stellarWallet: string;
  kycStatus?: KYCStatus;
  createdAt: string;
}

export interface Merchant extends User {
  webhookUrl?: string;
  preferences: {
    emailNotifications: boolean;
    autoWithdrawal: boolean;
    autoWithdrawalThreshold?: number;
    stellarExplorerLinks: boolean;
    twoFactorAuth: boolean;
  };
}

export interface Account {
  user: Merchant;
  balance: BalanceData;
  stats: AccountStats;
}

export interface BalanceData {
  usdc: number;
  ngn: number;
  available?: number;
  currency?: string;
  pending?: number;
  withdrawn?: number;
  ngnEquivalent?: number;
}

export interface AccountStats {
  totalVolume: number;
  paymentCount: number;
  conversionRate: number;
  paveFee: number;
  stellarFees: number;
  period: string;
}

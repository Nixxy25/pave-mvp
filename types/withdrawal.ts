export type WithdrawalStatus = 'pending' | 'processing' | 'settled' | 'failed' | 'completed';

export interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  country: string;
  isDefault?: boolean;
}

export interface Withdrawal {
  id: string;
  amount: number;
  currency: string;
  destination: BankAccount;
  narration?: string;
  stellarTxHash?: string;
  status: WithdrawalStatus;
  createdAt: string;
  settledAt?: string;
  estimatedArrival?: string;
}

export interface CreateWithdrawalData {
  amount: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  narration?: string;
}

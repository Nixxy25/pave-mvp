export interface StellarTransaction {
  hash: string;
  ledgerSequence: number;
  createdAt: string;
  operationType: string;
  sourceAccount: string;
  destinationAccount?: string;
  amount?: number;
  asset?: string;
}

export interface PathPayment {
  sourceCurrency: string;
  sourceAmount: number;
  destinationCurrency: string;
  destinationAmount: number;
  path: string[];
  networkFee: string;
}

export interface StellarPath {
  currency: string;
  amount: number;
  label: string;
  type: 'source' | 'bridge' | 'destination';
}

export interface SettlementProgress {
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  timestamp?: string;
}

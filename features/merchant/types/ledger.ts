export interface MerchantNetworkBalance {
  network: string;
  displayName: string;
  received: string;
  paymentCount: number;
}

export interface MerchantFinancialTransaction {
  paymentId: string;
  checkoutReference: string | null;
  customerName: string;
  grossAmount: number;
  grossCurrency: string;
  network: string | null;
  assetCode: string;
  assetAmount: number | null;
  status: string;
  transactionHash: string | null;
  paymentDate: string;
}

export interface MerchantTransactionPage {
  rows: MerchantFinancialTransaction[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

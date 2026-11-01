// A merchant-owned receiving wallet that the engine matches payments against.
export interface WatchedWallet {
  walletId: string;
  merchantId: string;
  address: string;
  usdcIssuer: string;
}

export interface HorizonTransaction {
  hash: string;
  successful: boolean;
  ledger: number;
  feeChargedStroops: string;
  sourceAccount: string;
  memoType: string;
  memo: string | null;
  createdAt: string;
}

export interface HorizonOperation {
  index: number;
  id: string;
  type: string;
  source: string;
  to: string | null;
  assetType: string | null;
  assetCode: string | null;
  assetIssuer: string | null;
  amount: string | null;
}

export interface HorizonClient {
  getTransaction(hash: string): Promise<HorizonTransaction>;
  getTransactionOperations(hash: string): Promise<HorizonOperation[]>;
}

export interface SessionSnapshot {
  id: string;
  status: string;
  walletId: string;
  receivingAddress: string;
  assetCode: string;
  assetIssuer: string | null;
  expectedUnits: string;
  expiresAt: string;
}

export interface OperationState {
  sessionId: string | null;
  posted: boolean;
  reconciliationReason: string | null;
}

export type ReconciliationReason =
  | 'unmatched_memo'
  | 'missing_memo'
  | 'wrong_asset'
  | 'underpaid'
  | 'overpaid'
  | 'late'
  | 'duplicate'
  | 'unsupported_operation'
  | 'verification_failed';

export type Disposition =
  | { kind: 'post'; sessionId: string }
  | { kind: 'reconcile'; reason: ReconciliationReason; sessionId: string | null; detail: Record<string, string> };

export interface RecordedOperation {
  operationIndex: number;
  operationId: string;
}

export interface StoreError extends Error {
  code?: string;
}

export interface PaymentEngineStore {
  recordTransaction(input: {
    transaction: HorizonTransaction;
    memo: string | null;
    operations: Array<{
      operation_index: number;
      operation_id: string;
      operation_type: string;
      source_address: string;
      destination_address: string;
      asset_code: string;
      asset_issuer: string | null;
      amount_units_1e7: string;
    }>;
  }): Promise<RecordedOperation[]>;
  getOperationState(operationId: string): Promise<OperationState | null>;
  findSessionByMemo(memo: string): Promise<SessionSnapshot | null>;
  markSessionConfirming(sessionId: string): Promise<void>;
  postVerifiedPayment(sessionId: string, operationId: string, payerName: string): Promise<{ paymentId: string }>;
  recordReconciliation(
    operationId: string,
    sessionId: string | null,
    reason: ReconciliationReason,
    detail: Record<string, string>,
  ): Promise<void>;
}

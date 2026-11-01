import type {
  OperationState,
  PaymentEngineStore,
  ReconciliationReason,
  SessionSnapshot,
  StoreError,
  WatchedWallet,
} from './types.ts';

export type Rpc = (
  fn: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>;

type Row = Record<string, unknown>;

export async function callRpc(rpc: Rpc, fn: string, args: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await rpc(fn, args);
  if (error) {
    const failure: StoreError = new Error(`${fn}: ${error.message}`);
    failure.code = error.code;
    throw failure;
  }
  return data;
}

export const rows = (data: unknown): Row[] => (Array.isArray(data) ? data as Row[] : []);

function toSnapshot(row: Row | undefined): SessionSnapshot | null {
  if (!row) return null;
  return {
    id: String(row.result_session_id),
    status: String(row.result_status),
    walletId: String(row.result_wallet_id),
    receivingAddress: String(row.result_receiving_address),
    assetCode: String(row.result_asset_code),
    assetIssuer: row.result_asset_reference === null ? null : String(row.result_asset_reference),
    expectedUnits: String(row.result_amount_units_1e7),
    expiresAt: new Date(String(row.result_expires_at)).toISOString(),
  };
}

export async function listWatchedWallets(rpc: Rpc): Promise<Array<WatchedWallet & { cursor: string | null }>> {
  return rows(await callRpc(rpc, 'list_watched_stellar_wallets', {})).map((row) => ({
    walletId: String(row.result_wallet_id),
    merchantId: String(row.result_merchant_id),
    address: String(row.result_address),
    usdcIssuer: String(row.result_usdc_issuer),
    cursor: (row.result_cursor as string | null) ?? null,
  }));
}

// Every database interaction goes through service_role-only functions.
export function createPaymentEngineStore(rpc: Rpc, network = 'stellar-testnet'): PaymentEngineStore {
  return {
    async recordTransaction({ transaction, memo, operations }) {
      const data = await callRpc(rpc, 'record_stellar_transaction', {
        p_network: network,
        p_transaction_hash: transaction.hash,
        p_source_address: transaction.sourceAccount,
        p_ledger_sequence: transaction.ledger,
        p_fee_native_units_1e7: Number(transaction.feeChargedStroops),
        p_memo: memo,
        p_successful: transaction.successful,
        p_occurred_at: transaction.createdAt,
        p_operations: operations,
      });
      return rows(data).map((row) => ({
        operationIndex: Number(row.result_operation_index),
        operationId: String(row.result_operation_id),
      }));
    },

    async getOperationState(operationId): Promise<OperationState | null> {
      const [row] = rows(await callRpc(rpc, 'get_operation_state', { p_operation_id: operationId }));
      if (!row) return null;
      return {
        sessionId: (row.result_payment_session_id as string | null) ?? null,
        posted: row.result_posted === true,
        reconciliationReason: (row.result_reconciliation_reason as string | null) ?? null,
      };
    },

    async findSessionByMemo(memo): Promise<SessionSnapshot | null> {
      return toSnapshot(rows(await callRpc(rpc, 'find_payment_session_by_memo', { p_memo: memo }))[0]);
    },

    async markSessionConfirming(sessionId) {
      await callRpc(rpc, 'mark_payment_session_confirming', { p_session_id: sessionId });
    },

    async postVerifiedPayment(sessionId, operationId, payerName) {
      const [row] = rows(await callRpc(rpc, 'post_verified_usdc_payment', {
        p_payment_session_id: sessionId,
        p_blockchain_operation_id: operationId,
        p_payer_name: payerName,
      }));
      if (!row) throw new Error('post_verified_usdc_payment returned no result.');
      return { paymentId: String(row.result_payment_id) };
    },

    async recordReconciliation(operationId, sessionId, reason: ReconciliationReason, detail) {
      await callRpc(rpc, 'record_payment_reconciliation_item', {
        p_operation_id: operationId,
        p_session_id: sessionId,
        p_reason: reason,
        p_detail: detail,
      });
    },
  };
}

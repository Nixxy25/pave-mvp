import { toUnits } from './amounts.ts';
import { classifyPayment } from './classify.ts';
import { HorizonRequestError } from './horizon.ts';
import type {
  HorizonClient,
  HorizonOperation,
  PaymentEngineStore,
  ReconciliationReason,
  StoreError,
  WatchedWallet,
} from './types.ts';

const INCOMING_TYPES = ['payment', 'path_payment_strict_receive', 'path_payment_strict_send'];

export interface ProcessSummary {
  posted: number;
  replayed: number;
  unknown: number;
  reconciled: Partial<Record<ReconciliationReason, number>>;
}

export interface ProcessorDeps {
  horizon: HorizonClient;
  store: PaymentEngineStore;
  wallets: WatchedWallet[];
  log?: (message: string) => void;
}

function assetOf(op: HorizonOperation): { code: string; issuer: string | null } {
  return op.assetType === 'native'
    ? { code: 'XLM', issuer: null }
    : { code: op.assetCode ?? '', issuer: op.assetIssuer };
}

// Independently verifies each transaction against Horizon (never trusting a webhook
// payload), then posts or reconciles every operation paid to a merchant
// wallet. Safe to replay: records are idempotent and dispositioned operations are
// skipped. Throws without side effects beyond idempotent records on anything unexpected.
export async function processTransactions(
  deps: ProcessorDeps,
  hashes: string[],
): Promise<ProcessSummary> {
  const { horizon, store } = deps;
  const walletByAddress = new Map(deps.wallets.map((w) => [w.address, w]));
  const summary: ProcessSummary = { posted: 0, replayed: 0, unknown: 0, reconciled: {} };

  for (const hash of [...new Set(hashes)]) {
    let transaction;
    try {
      transaction = await horizon.getTransaction(hash);
    } catch (error) {
      // Not on this network (or not visible yet); QuickNode retries real ones.
      if (error instanceof HorizonRequestError && error.status === 404) {
        summary.unknown += 1;
        continue;
      }
      throw error;
    }
    if (!transaction.successful) continue;

    const operations = (await horizon.getTransactionOperations(hash)).filter(
      (op) => INCOMING_TYPES.includes(op.type)
        && op.to !== null
        && walletByAddress.has(op.to)
        && op.amount !== null
        && op.assetType !== null,
    );
    if (!operations.length) continue;

    const memo = transaction.memoType === 'text' && transaction.memo ? transaction.memo : null;
    const recorded = await store.recordTransaction({
      transaction,
      memo,
      operations: operations.map((op) => {
        const asset = assetOf(op);
        return {
          operation_index: op.index,
          operation_id: op.id,
          operation_type: op.type,
          source_address: op.source,
          destination_address: op.to as string,
          asset_code: asset.code,
          asset_issuer: asset.issuer,
          amount_units_1e7: toUnits(op.amount as string),
        };
      }),
    });

    for (const op of operations) {
      const saved = recorded.find((r) => r.operationIndex === op.index);
      if (!saved) throw new Error(`Operation ${op.index} of ${hash} was not recorded.`);

      const state = await store.getOperationState(saved.operationId);
      if (state?.posted || state?.reconciliationReason) {
        summary.replayed += 1;
        continue;
      }

      const wallet = walletByAddress.get(op.to as string) as WatchedWallet;
      const asset = assetOf(op);
      const session = memo ? await store.findSessionByMemo(memo) : null;
      const disposition = classifyPayment(
        {
          type: op.type,
          destination: op.to as string,
          assetCode: asset.code,
          assetIssuer: asset.issuer,
          units: toUnits(op.amount as string),
          occurredAt: transaction.createdAt,
        },
        memo,
        wallet,
        session,
      );

      const reconcile = async (
        reason: ReconciliationReason,
        sessionId: string | null,
        detail: Record<string, string>,
      ) => {
        await store.recordReconciliation(saved.operationId, sessionId, reason, detail);
        summary.reconciled[reason] = (summary.reconciled[reason] ?? 0) + 1;
        deps.log?.(`reconciliation ${reason}: tx ${hash} op ${op.index}`);
      };

      if (disposition.kind === 'reconcile') {
        await reconcile(disposition.reason, disposition.sessionId, disposition.detail);
        continue;
      }

      await store.markSessionConfirming(disposition.sessionId);
      try {
        await store.postVerifiedPayment(
          disposition.sessionId,
          saved.operationId,
          `Stellar ${transaction.sourceAccount.slice(0, 8)}…`,
        );
        summary.posted += 1;
        deps.log?.(`posted verified payment: tx ${hash} op ${op.index}`);
      } catch (error) {
        const code = (error as StoreError).code;
        if (code === '23514' || code === '23505' || code === 'P0002') {
          await reconcile(
            code === '23505' ? 'duplicate' : 'verification_failed',
            disposition.sessionId,
            { database_error: (error as Error).message.slice(0, 200) },
          );
        } else {
          throw error;
        }
      }
    }
  }

  return summary;
}

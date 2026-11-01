import type {
  HorizonClient,
  HorizonOperation,
  HorizonTransaction,
} from './types.ts';

interface HorizonRecord {
  [key: string]: unknown;
}

export class HorizonRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HorizonRequestError';
    this.status = status;
  }
}

export function createHorizonClient(baseUrl: string, timeoutMs = 15_000): HorizonClient {
  const root = baseUrl.replace(/\/+$/, '');

  async function get(path: string): Promise<HorizonRecord> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const response = await fetch(`${root}${path}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (response.ok) return await response.json() as HorizonRecord;
        if (response.status !== 429 && response.status < 500) {
          throw new HorizonRequestError(`Horizon returned HTTP ${response.status} for ${path}`, response.status);
        }
        lastError = new HorizonRequestError(`Horizon returned HTTP ${response.status}`, response.status);
      } catch (error) {
        if (error instanceof HorizonRequestError && error.status < 500 && error.status !== 429) throw error;
        lastError = error;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
    throw lastError instanceof Error ? lastError : new Error('Horizon request failed.');
  }

  return {
    async getTransaction(hash): Promise<HorizonTransaction> {
      const tx = await get(`/transactions/${encodeURIComponent(hash)}`);
      return {
        hash: String(tx.hash),
        successful: tx.successful === true,
        ledger: Number(tx.ledger),
        feeChargedStroops: String(tx.fee_charged ?? '0'),
        sourceAccount: String(tx.source_account),
        memoType: String(tx.memo_type ?? 'none'),
        memo: typeof tx.memo === 'string' ? tx.memo : null,
        createdAt: String(tx.created_at),
      };
    },

    async getTransactionOperations(hash): Promise<HorizonOperation[]> {
      const body = await get(`/transactions/${encodeURIComponent(hash)}/operations?limit=200&order=asc`);
      const records = ((body._embedded as { records?: HorizonRecord[] } | undefined)?.records ?? []);
      return records.map((record, index) => ({
        index,
        id: String(record.id),
        type: String(record.type),
        source: String(record.source_account),
        to: typeof record.to === 'string' ? record.to : null,
        assetType: typeof record.asset_type === 'string' ? record.asset_type : null,
        assetCode: typeof record.asset_code === 'string' ? record.asset_code : null,
        assetIssuer: typeof record.asset_issuer === 'string' ? record.asset_issuer : null,
        amount: typeof record.amount === 'string' ? record.amount : null,
      }));
    },
  };
}

// QuickNode's Ledger dataset carries no transaction hashes, so the hashes of payments that
// landed in a closed ledger come from Horizon. Only payments to the given addresses are
// returned; each hash is still fully re-verified by the processor. A missing ledger (Horizon
// not caught up yet) throws, so the delivery fails and QuickNode retries it.
export async function listLedgerPaymentHashes(
  baseUrl: string,
  sequence: number,
  addresses: Set<string>,
  timeoutMs = 15_000,
): Promise<string[]> {
  const root = baseUrl.replace(/\/+$/, '');
  const hashes = new Set<string>();
  let cursor = '';
  for (let page = 0; page < 5; page += 1) {
    const query = new URLSearchParams({ limit: '200', include_failed: 'false' });
    if (cursor) query.set('cursor', cursor);
    const response = await fetch(`${root}/ledgers/${sequence}/payments?${query}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new HorizonRequestError(`Horizon returned HTTP ${response.status} for ledger ${sequence}`, response.status);
    const body = await response.json() as { _embedded?: { records?: HorizonRecord[] } };
    const records = body._embedded?.records ?? [];
    for (const record of records) {
      if (typeof record.to === 'string' && addresses.has(record.to) && typeof record.transaction_hash === 'string') {
        hashes.add(record.transaction_hash);
      }
    }
    if (records.length < 200) break;
    cursor = String(records[records.length - 1].paging_token);
  }
  return [...hashes];
}

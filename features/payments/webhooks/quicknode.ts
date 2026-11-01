import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const MAX_BODY_BYTES = 5 * 1024 * 1024;
export const MAX_SKEW_SECONDS = 300;
export const MAX_HASHES = 200;

export interface SignatureHeaders {
  nonce: string | null;
  timestamp: string | null;
  signature: string | null;
}

// QuickNode signs HMAC-SHA256(securityToken, nonce + timestamp + rawBody) as hex.
export function verifyQuickNodeSignature(
  secret: string,
  rawBody: string,
  headers: SignatureHeaders,
  nowSeconds = Math.floor(Date.now() / 1000),
): 'ok' | 'missing' | 'stale' | 'invalid' {
  const { nonce, timestamp, signature } = headers;
  if (!nonce || !timestamp || !signature) return 'missing';
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) return 'invalid';
  // Accept seconds or milliseconds.
  const sentSeconds = sentAt > 1e11 ? Math.floor(sentAt / 1000) : sentAt;
  if (Math.abs(nowSeconds - sentSeconds) > MAX_SKEW_SECONDS) return 'stale';

  const expected = createHmac('sha256', Buffer.from(secret)).update(nonce + timestamp + rawBody).digest();
  const given = /^[0-9a-f]{64}$/i.test(signature) ? Buffer.from(signature, 'hex') : null;
  if (!given || given.length !== expected.length) return 'invalid';
  return timingSafeEqual(expected, given) ? 'ok' : 'invalid';
}

export function payloadHash(rawBody: string): string {
  return createHash('sha256').update(rawBody).digest('hex');
}

const HASH_KEYS = new Set(['hash', 'transaction_hash', 'transactionHash', 'tx_hash', 'txHash']);
const HASH_PATTERN = /^[0-9a-f]{64}$/i;

// The payload is only a hint about which transactions to look at. Every hash it
// names is re-verified against Horizon before anything is credited.
export function extractTransactionHashes(payload: unknown): string[] {
  const found = new Set<string>();
  const stack: unknown[] = [payload];
  let visited = 0;
  while (stack.length && found.size < MAX_HASHES && visited < 200_000) {
    const node = stack.pop();
    visited += 1;
    if (Array.isArray(node)) {
      for (const item of node) stack.push(item);
    } else if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        if (HASH_KEYS.has(key) && typeof value === 'string' && HASH_PATTERN.test(value)) {
          found.add(value.toLowerCase());
        } else if (value && typeof value === 'object') {
          stack.push(value);
        }
      }
    }
  }
  return [...found];
}

// The Ledger dataset delivers whole ledgers: { data: [{ sequence, ledgerCloseTime, ... }] }.
export function extractLedgerSequences(payload: unknown): number[] {
  const items = (payload as { data?: unknown })?.data;
  if (!Array.isArray(items)) return [];
  const sequences = new Set<number>();
  for (const item of items) {
    const record = item as { sequence?: unknown; ledgerCloseTime?: unknown };
    const sequence = Number(record?.sequence);
    if (record?.ledgerCloseTime !== undefined && Number.isInteger(sequence) && sequence > 0) sequences.add(sequence);
  }
  return [...sequences].slice(0, 20);
}

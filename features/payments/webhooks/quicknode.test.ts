import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { extractTransactionHashes, verifyQuickNodeSignature } from './quicknode.ts';

const secret = 'token';
const body = '{"a":1}';
const now = 1_900_000_000;
const sign = (nonce: string, ts: string) => createHmac('sha256', secret).update(nonce + ts + body).digest('hex');

test('verifies valid signature and rejects tampering, staleness and missing headers', () => {
  const ts = String(now);
  const good = { nonce: 'n', timestamp: ts, signature: sign('n', ts) };
  assert.equal(verifyQuickNodeSignature(secret, body, good, now), 'ok');
  assert.equal(verifyQuickNodeSignature(secret, body + ' ', good, now), 'invalid');
  assert.equal(verifyQuickNodeSignature('other', body, good, now), 'invalid');
  assert.equal(verifyQuickNodeSignature(secret, body, good, now + 1000), 'stale');
  assert.equal(verifyQuickNodeSignature(secret, body, { nonce: null, timestamp: ts, signature: null }, now), 'missing');
});

test('extracts only 64-hex transaction hashes', () => {
  const h = 'a'.repeat(64);
  const found = extractTransactionHashes({ data: [{ transaction_hash: h }, { hash: 'short' }, { other: 'b'.repeat(64) }] });
  assert.deepEqual(found, [h]);
});

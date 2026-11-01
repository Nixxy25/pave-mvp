import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyPayment, type ObservedPayment } from './classify.ts';
import type { SessionSnapshot, WatchedWallet } from './types.ts';

const wallet: WatchedWallet = { walletId: 'w1', merchantId: 'm1', address: 'GWALLET', usdcIssuer: 'GISSUER' };
const session: SessionSnapshot = {
  id: 's1', status: 'pending', walletId: 'w1', receivingAddress: 'GWALLET', assetCode: 'USDC',
  assetIssuer: 'GISSUER', expectedUnits: '100000000', expiresAt: '2030-01-01T00:10:00Z',
};
const payment: ObservedPayment = {
  type: 'payment', destination: 'GWALLET', assetCode: 'USDC', assetIssuer: 'GISSUER',
  units: '100000000', occurredAt: '2030-01-01T00:05:00Z',
};

test('exact USDC payment with memo posts', () => {
  assert.deepEqual(classifyPayment(payment, 'PVABC', wallet, session), { kind: 'post', sessionId: 's1' });
});

test('wrong asset, missing memo, unknown memo reconcile', () => {
  const reason = (d: ReturnType<typeof classifyPayment>) => (d.kind === 'reconcile' ? d.reason : 'post');
  assert.equal(reason(classifyPayment({ ...payment, assetIssuer: 'GOTHER' }, 'PV', wallet, session)), 'wrong_asset');
  assert.equal(reason(classifyPayment({ ...payment, assetCode: 'XLM', assetIssuer: null }, 'PV', wallet, session)), 'wrong_asset');
  assert.equal(reason(classifyPayment(payment, null, wallet, session)), 'missing_memo');
  assert.equal(reason(classifyPayment(payment, 'PV', wallet, null)), 'unmatched_memo');
});

test('amount, expiry, duplicate and wallet mismatches never post', () => {
  const reason = (d: ReturnType<typeof classifyPayment>) => (d.kind === 'reconcile' ? d.reason : 'post');
  assert.equal(reason(classifyPayment({ ...payment, units: '99999999' }, 'PV', wallet, session)), 'underpaid');
  assert.equal(reason(classifyPayment({ ...payment, units: '100000001' }, 'PV', wallet, session)), 'overpaid');
  assert.equal(reason(classifyPayment({ ...payment, occurredAt: '2030-01-01T00:11:00Z' }, 'PV', wallet, session)), 'late');
  assert.equal(reason(classifyPayment(payment, 'PV', wallet, { ...session, status: 'paid' })), 'duplicate');
  assert.equal(reason(classifyPayment({ ...payment, destination: 'GOTHER' }, 'PV', wallet, session)), 'verification_failed');
  assert.equal(reason(classifyPayment(payment, 'PV', wallet, { ...session, walletId: 'w2' })), 'verification_failed');
});

import { compareUnits } from './amounts.ts';
import type { Disposition, SessionSnapshot, WatchedWallet } from './types.ts';

export interface ObservedPayment {
  type: string;
  destination: string;
  assetCode: string;
  assetIssuer: string | null;
  units: string;
  occurredAt: string;
}

const POSTABLE_STATUSES = ['pending', 'confirming', 'expired'];

// Pure decision logic. The database re-verifies every condition inside
// post_verified_usdc_payment; this only decides what to attempt and how to
// label operations that must be preserved for reconciliation. Only Circle USDC
// sent to the merchant's own wallet with the session memo can ever post.
export function classifyPayment(
  payment: ObservedPayment,
  memo: string | null,
  wallet: WatchedWallet,
  session: SessionSnapshot | null,
): Disposition {
  const sessionId = session?.id ?? null;
  const detail: Record<string, string> = {
    asset_code: payment.assetCode,
    asset_issuer: payment.assetIssuer ?? '',
    units: payment.units,
  };

  if (payment.type !== 'payment') {
    return { kind: 'reconcile', reason: 'unsupported_operation', sessionId, detail: { ...detail, operation_type: payment.type } };
  }
  if (payment.assetCode !== 'USDC' || payment.assetIssuer !== wallet.usdcIssuer) {
    return { kind: 'reconcile', reason: 'wrong_asset', sessionId, detail };
  }
  if (!memo) return { kind: 'reconcile', reason: 'missing_memo', sessionId: null, detail };
  if (!session) return { kind: 'reconcile', reason: 'unmatched_memo', sessionId: null, detail: { ...detail, memo } };

  if (
    payment.destination !== wallet.address
    || session.receivingAddress !== wallet.address
    || session.walletId !== wallet.walletId
    || session.assetCode !== 'USDC'
    || session.assetIssuer !== wallet.usdcIssuer
  ) {
    return { kind: 'reconcile', reason: 'verification_failed', sessionId, detail: { ...detail, cause: 'wallet_mismatch' } };
  }
  if (session.status === 'paid') return { kind: 'reconcile', reason: 'duplicate', sessionId, detail };
  if (new Date(payment.occurredAt).getTime() > new Date(session.expiresAt).getTime()) {
    return { kind: 'reconcile', reason: 'late', sessionId, detail: { ...detail, expires_at: session.expiresAt, occurred_at: payment.occurredAt } };
  }

  const comparison = compareUnits(payment.units, session.expectedUnits);
  if (comparison < 0) return { kind: 'reconcile', reason: 'underpaid', sessionId, detail: { ...detail, expected_units: session.expectedUnits } };
  if (comparison > 0) return { kind: 'reconcile', reason: 'overpaid', sessionId, detail: { ...detail, expected_units: session.expectedUnits } };

  if (!POSTABLE_STATUSES.includes(session.status)) {
    return { kind: 'reconcile', reason: 'verification_failed', sessionId, detail: { ...detail, cause: `session_${session.status}` } };
  }
  return { kind: 'post', sessionId: session.id };
}

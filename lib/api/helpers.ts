// Private helpers shared across domain modules — not re-exported from the barrel.

import { getCurrentUser as getCognitoUser } from 'aws-amplify/auth';
import type { CheckoutLink, Payment } from '@/types';

// ─── Auth ──────────────────────────────────────────────────────────────────────

export async function getCurrentUserId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const user = await getCognitoUser();
    return user.userId;
  } catch {
    return null;
  }
}

// ─── localStorage (per-user keyed storage) ────────────────────────────────────

export async function getUserData<T>(key: string, defaultValue: T): Promise<T> {
  if (typeof window === 'undefined') return defaultValue;
  const userId = await getCurrentUserId();
  if (!userId) return defaultValue;

  const data = localStorage.getItem(`pave_${key}_${userId}`);
  return data ? JSON.parse(data) : defaultValue;
}

export async function setUserData<T>(key: string, value: T): Promise<void> {
  if (typeof window === 'undefined') return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  localStorage.setItem(`pave_${key}_${userId}`, JSON.stringify(value));
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

export function rowToCheckoutLink(row: Record<string, unknown>): CheckoutLink {
  return {
    id: row.id as string,
    paymentId: row.id as string,
    url: `${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/${row.id}`,
    amount: row.amount as number,
    currency: row.currency as string,
    description: row.description as string,
    acceptedCurrencies: row.accepted_currencies as string[],
    settlementAsset: row.settlement_asset as string,
    stellarWalletAddress: row.stellar_wallet_address as string | undefined,
    equivalents: (row.equivalents as Record<string, number>) || {},
    expiresAt: row.expires_at as string,
    createdAt: row.created_at as string,
    status: row.status as 'active' | 'expired' | 'completed',
    merchantName: row.merchant_name as string | undefined,
    merchantVerified: row.merchant_verified as boolean | undefined,
  };
}

export function rowToPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    status: row.status as Payment['status'],
    payer: {
      name: row.payer_name as string,
      email: row.payer_email as string | undefined,
      country: row.payer_country as string | undefined,
    },
    amount: row.amount as number,
    currency: row.currency as string,
    usdcAmount: row.usdc_amount as number | undefined,
    paidWith: row.paid_with as string | undefined,
    settledAmount: row.settled_amount as number,
    settledCurrency: row.settled_currency as string,
    method: row.method as Payment['method'],
    source: row.source as Payment['source'],
    stellarTxHash: row.stellar_tx_hash as string | undefined,
    description: row.description as string | undefined,
    createdAt: row.created_at as string,
    settledAt: row.settled_at as string | undefined,
  };
}

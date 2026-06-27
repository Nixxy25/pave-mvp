// Private helpers shared across domain modules — not re-exported from the barrel.

import type { CheckoutLink, Payment } from '@/types';


export function formatTimeAgo(createdAt: string): string {
  const date = new Date(createdAt);
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  // Show relative time for recent activity
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  // Show full date with month for older dates
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
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

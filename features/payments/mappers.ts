// Row mappers shared by the merchant and customer modules.

import type { CheckoutLink, Payment } from '@/types';

function getCheckoutUrl(id: string): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_PAY_BASE_URL?.replace(/\/+$/, '');
  const baseUrl =
    configuredBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${baseUrl}/checkout/${id}`;
}

export function rowToCheckoutLink(row: Record<string, unknown>): CheckoutLink {
  return {
    id: row.id as string,
    paymentId: row.id as string,
    url: getCheckoutUrl(row.id as string),
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

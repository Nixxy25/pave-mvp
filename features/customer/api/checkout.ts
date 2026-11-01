export interface CheckoutQuote {
  usdcAmount: number;
  quotedAt: string;
  expiresAt: string;
  source: string;
}

export interface CheckoutInfo {
  id: string;
  merchantName: string;
  merchantVerified: boolean;
  amount: number | string;
  currency: string;
  title: string;
  description: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'completed';
  acceptedPaymentMethods: Array<'crypto' | 'bank_transfer'>;
  completion: {
    amount: string;
    assetCode: CheckoutAssetCode;
    network: string;
    transactionHash: string | null;
    paidAt: string | null;
  } | null;
}

export type CheckoutPaymentStatus =
  | 'awaiting_payment'
  | 'payment_detected'
  | 'verifying'
  | 'completed'
  | 'expired'
  | 'payment_issue';

export type CheckoutAssetCode = 'USDC';

export interface CheckoutPaymentSession {
  id: string;
  checkoutLinkId: string;
  amount: string;
  invoiceAmount: string;
  invoiceCurrency: string;
  assetCode: CheckoutAssetCode;
  network: 'stellar-testnet' | 'stellar-mainnet' | 'base-sepolia' | 'ethereum-sepolia';
  destinationAddress: string | null;
  memo: string | null;
  createdAt: string;
  expiresAt: string;
  status: CheckoutPaymentStatus;
}

export interface CheckoutConfirmation {
  id: string;
  sessionId: string;
  merchantName: string;
  invoiceAmount: string;
  invoiceCurrency: string;
  amount: string;
  assetCode: CheckoutAssetCode;
  network: string;
  transactionHash: string;
  createdAt: string;
  explorerUrl: string;
}

export class CheckoutApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'CheckoutApiError';
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as {
    data?: T;
    error?: string;
    code?: string;
  } | null;
  if (!response.ok) {
    throw new CheckoutApiError(
      body?.error || 'The checkout request could not be completed.',
      response.status,
      body?.code,
    );
  }
  if (!body?.data) throw new CheckoutApiError('The checkout response was invalid.', 502);
  return body.data;
}

export async function getCheckoutQuote(checkoutLinkId: string): Promise<CheckoutQuote> {
  return readJson<CheckoutQuote>(
    await fetch(`/api/checkout/quotes?checkoutLinkId=${encodeURIComponent(checkoutLinkId)}`, { cache: 'no-store' }),
  );
}

export async function getCheckoutInfo(id: string): Promise<CheckoutInfo> {
  return readJson<CheckoutInfo>(
    await fetch(`/api/checkout?id=${encodeURIComponent(id)}`, { cache: 'no-store' }),
  );
}

export async function createCheckoutPaymentSession(
  checkoutLinkId: string,
  idempotencyKey: string,
  assetCode: CheckoutAssetCode = 'USDC',
): Promise<CheckoutPaymentSession> {
  return readJson<CheckoutPaymentSession>(
    await fetch('/api/checkout/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ checkoutLinkId, idempotencyKey, assetCode }),
    }),
  );
}

export async function getCheckoutPaymentSession(
  sessionId: string,
  checkoutLinkId: string,
): Promise<CheckoutPaymentSession> {
  return readJson<CheckoutPaymentSession>(
    await fetch(
      `/api/checkout/sessions/${encodeURIComponent(sessionId)}?checkoutLinkId=${encodeURIComponent(checkoutLinkId)}`,
      { cache: 'no-store' },
    ),
  );
}

export async function getCheckoutConfirmation(sessionId: string): Promise<CheckoutConfirmation> {
  return readJson<CheckoutConfirmation>(
    await fetch(`/api/checkout/sessions/${encodeURIComponent(sessionId)}/confirmation`, {
      cache: 'no-store',
    }),
  );
}

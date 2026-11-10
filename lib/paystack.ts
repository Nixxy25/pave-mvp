// Server-only Paystack helpers. Requires PAYSTACK_SECRET_KEY.
const BASE = 'https://api.paystack.co';

export type PaystackChannel = 'card' | 'bank_transfer' | 'mobile_money' | 'ussd' | 'bank';

/**
 * Mock mode: lets the whole checkout run end-to-end with no Paystack account.
 * Needs PAYSTACK_MOCK=true and NO secret key, and can never be on in production.
 */
export function isMockPaystack() {
  return (
    process.env.PAYSTACK_MOCK === 'true' &&
    !process.env.PAYSTACK_SECRET_KEY &&
    process.env.NODE_ENV !== 'production'
  );
}

export function paystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY) || isMockPaystack();
}

export interface MockTx {
  reference: string;
  amount: number;
  currency: string;
  channels: PaystackChannel[];
  channel: string;
  callback_url: string;
  metadata: Record<string, unknown> | null;
  email: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: number;
}

// Survives dev hot reloads; intentionally in-memory (mock only).
const g = globalThis as unknown as { __mockPaystack?: Map<string, MockTx> };
export const mockStore: Map<string, MockTx> = (g.__mockPaystack ??= new Map());

async function paystack<T>(path: string, init?: RequestInit): Promise<T> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not set');
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || json.status === false) {
    throw new Error(json.message || `Paystack request failed (${res.status})`);
  }
  return json.data as T;
}

export interface PaystackInitData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function initializeTransaction(body: {
  email: string;
  amount: number; // minor units (e.g. cents / pesewas)
  currency: string;
  reference: string;
  callback_url: string;
  channels?: PaystackChannel[];
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitData> {
  if (isMockPaystack()) {
    mockStore.set(body.reference, {
      reference: body.reference,
      amount: body.amount,
      currency: body.currency,
      channels: body.channels || ['card'],
      channel: (body.channels || ['card'])[0],
      callback_url: body.callback_url,
      metadata: body.metadata || null,
      email: body.email,
      status: 'pending',
      createdAt: Date.now(),
    });
    return {
      authorization_url: `${new URL(body.callback_url).origin}/mock-paystack/${body.reference}`,
      access_code: 'mock',
      reference: body.reference,
    };
  }
  return paystack<PaystackInitData>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export interface PaystackVerifyData {
  status: string; // 'success' when paid
  reference: string;
  amount: number; // minor units
  currency: string;
  channel: string;
  metadata: Record<string, unknown> | null;
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifyData> {
  if (isMockPaystack()) {
    const tx = mockStore.get(reference);
    if (!tx) throw new Error('Transaction reference not found');
    return {
      status: tx.status === 'success' ? 'success' : tx.status === 'failed' ? 'failed' : 'abandoned',
      reference,
      amount: tx.amount,
      currency: tx.currency,
      channel: tx.channel,
      metadata: tx.metadata,
    };
  }
  return paystack<PaystackVerifyData>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

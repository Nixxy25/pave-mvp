import { NextRequest, NextResponse } from 'next/server';
import { isMockPaystack, mockStore } from '@/lib/paystack';

// Dev-only stand-in for Paystack's hosted page API. 404 everywhere unless PAYSTACK_MOCK=true.
const off = () => NextResponse.json({ error: 'Not found' }, { status: 404 });

// GET /api/mock-paystack?reference=… → transaction details for the fake hosted page
export async function GET(req: NextRequest) {
  if (!isMockPaystack()) return off();
  const tx = mockStore.get(req.nextUrl.searchParams.get('reference') || '');
  if (!tx) return off();
  return NextResponse.json({
    reference: tx.reference,
    amount: tx.amount / 100,
    currency: tx.currency,
    channels: tx.channels,
    status: tx.status,
    callbackUrl: tx.callback_url,
    email: tx.email,
  });
}

// POST /api/mock-paystack { reference, action: 'pay' | 'fail', channel? }
export async function POST(req: NextRequest) {
  if (!isMockPaystack()) return off();
  const { reference, action, channel } = await req.json().catch(() => ({}));
  const tx = mockStore.get(reference);
  if (!tx) return off();
  if (tx.status === 'pending') {
    if (typeof channel === 'string' && tx.channels.includes(channel as never)) tx.channel = channel;
    tx.status = action === 'pay' ? 'success' : 'failed';
  }
  return NextResponse.json({ status: tx.status, redirect: `${tx.callback_url}?reference=${tx.reference}&trxref=${tx.reference}` });
}

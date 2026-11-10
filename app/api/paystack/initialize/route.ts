import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { convertFiat } from '@/lib/exchange-rates';
import { initializeTransaction, paystackConfigured, type PaystackChannel } from '@/lib/paystack';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CURRENCIES = ['USD', 'GHS', 'KES'];
const CHANNELS: Record<string, PaystackChannel[]> = {
  card: ['card'],
  transfer: ['bank_transfer', 'mobile_money', 'ussd', 'bank'],
};

// GET /api/paystack/initialize → public: is Paystack configured? (lets the checkout hide unavailable methods)
export async function GET() {
  return NextResponse.json({ enabled: paystackConfigured() });
}

// POST /api/paystack/initialize → public: start a hosted Paystack payment for a checkout link.
// The amount is always computed here from the stored link, never trusted from the client.
export async function POST(req: NextRequest) {
  if (!paystackConfigured()) {
    return NextResponse.json({ error: 'Card and bank payments are not configured yet' }, { status: 503 });
  }

  const { checkoutLinkId, customerName, customerEmail, currency, method } = await req.json().catch(() => ({}));

  if (!checkoutLinkId || typeof customerName !== 'string' || !customerName.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (typeof customerEmail !== 'string' || !EMAIL_RE.test(customerEmail.trim())) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }
  const channels = CHANNELS[method as string];
  if (!channels) return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 });

  const { data: link } = await supabase
    .from('checkout_links')
    .select('id, amount, currency, accepted_currencies, status')
    .eq('id', checkoutLinkId)
    .single();

  if (!link) return NextResponse.json({ error: 'Checkout link not found' }, { status: 404 });
  if (link.status !== 'active') {
    return NextResponse.json({ error: 'Checkout link is no longer active' }, { status: 400 });
  }

  const accepted: string[] = (link.accepted_currencies as string[]) || [];
  const payCurrency = String(currency || link.currency).toUpperCase();
  if (!CURRENCIES.includes(payCurrency) || (payCurrency !== link.currency && !accepted.includes(payCurrency))) {
    return NextResponse.json({ error: 'Currency not accepted for this link' }, { status: 400 });
  }

  let payAmount: number;
  try {
    payAmount = await convertFiat(link.amount, link.currency, payCurrency);
  } catch {
    return NextResponse.json({ error: 'Unable to calculate payment amount' }, { status: 500 });
  }
  const amountMinor = Math.round(payAmount * 100);
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const reference = `pave_${randomUUID().replace(/-/g, '')}`;
  const origin = req.nextUrl.origin;

  try {
    const init = await initializeTransaction({
      email: customerEmail.trim(),
      amount: amountMinor,
      currency: payCurrency,
      reference,
      callback_url: `${origin}/checkout/${checkoutLinkId}`,
      channels,
      // Set server-side; read back on verify so the client can't alter what was charged.
      metadata: {
        checkout_link_id: checkoutLinkId,
        customer_name: customerName.trim().slice(0, 120),
        expected_amount_minor: amountMinor,
        expected_currency: payCurrency,
      },
    });
    return NextResponse.json({ url: init.authorization_url, reference: init.reference });
  } catch (err) {
    console.error('[paystack/initialize]', err);
    return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 502 });
  }
}

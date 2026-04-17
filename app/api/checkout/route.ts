import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/checkout?id=xxx  → public: fetch checkout link + merchant info
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data, error } = await supabase
    .from('checkout_links')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ data });
}

// POST /api/checkout  → public: complete a checkout payment
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { checkoutLinkId, customerName, amount, currency, usdcAmount,
          description, paymentMethod, stellarTxHash } = body;

  if (!checkoutLinkId || !customerName || !amount || !currency || !usdcAmount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Fetch the checkout link to get the merchant_id
  const { data: linkRow, error: linkError } = await supabase
    .from('checkout_links')
    .select('merchant_id')
    .eq('id', checkoutLinkId)
    .single();

  if (linkError || !linkRow) {
    return NextResponse.json({ error: 'Checkout link not found' }, { status: 404 });
  }

  const countryMap: Record<string, string> = {
    GHS: 'GH', KES: 'KE', NGN: 'NG', USD: 'US', XLM: 'US',
  };

  const isStellar = paymentMethod === 'stellar';

  const { data: inserted, error } = await supabase
    .from('payments')
    .insert({
      merchant_id: linkRow.merchant_id,
      checkout_link_id: checkoutLinkId,
      payer_name: customerName,
      payer_country: countryMap[currency] || 'NG',
      amount,
      currency,
      usdc_amount: usdcAmount,
      paid_with: isStellar ? 'XLM' : 'Visa Card',
      settled_amount: usdcAmount,
      settled_currency: 'USDC',
      method: isStellar ? 'Stellar Wallet' : 'Card',
      source: 'Checkout',
      description,
      status: 'completed',
      settled_at: new Date().toISOString(),
      ...(isStellar && stellarTxHash ? { stellar_tx_hash: stellarTxHash } : {}),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from('checkout_links')
    .update({ status: 'completed' })
    .eq('id', checkoutLinkId);

  return NextResponse.json({ success: true, paymentId: inserted.id }, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { paymentMethodsForCurrency } from '@/features/payments/checkout-methods';
import { formatCustomerAmount } from '@/features/customer/server/payment-sessions';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id || !UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Checkout link not found.' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('checkout_links')
    .select('id, merchant_name, merchant_verified, amount, currency, title, description, expires_at, status, accepted_payment_methods')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[checkout] Failed to load checkout link:', error.message);
    return NextResponse.json({ error: 'Checkout is temporarily unavailable.' }, { status: 503 });
  }
  if (!data) return NextResponse.json({ error: 'Checkout link not found.' }, { status: 404 });

  const expired = data.status === 'expired' || new Date(data.expires_at).getTime() <= Date.now();
  const status = data.status === 'completed' ? 'completed' : expired ? 'expired' : data.status;
  let completion: {
    amount: string; assetCode: string; network: string; transactionHash: string | null; paidAt: string | null;
  } | null = null;
  if (status === 'completed') {
    const { data: rows, error: completionError } = await supabase
      .rpc('get_checkout_link_completion', { p_checkout_link_id: data.id });
    if (completionError) console.error('[checkout] Completion details unavailable:', completionError.message);
    const paid = Array.isArray(rows) ? rows[0] : null;
    if (paid) {
      completion = {
        amount: formatCustomerAmount(paid.result_amount_units),
        assetCode: paid.result_asset_code,
        network: paid.result_network,
        transactionHash: paid.result_tx_hash ?? null,
        paidAt: paid.result_paid_at,
      };
    }
  }
  return NextResponse.json({
    data: {
      completion,
      id: data.id,
      merchantName: data.merchant_name || 'Business',
      merchantVerified: data.merchant_verified ?? false,
      amount: data.amount,
      currency: data.currency,
      title: data.title || data.description,
      description: data.title && data.description !== data.title ? data.description : '',
      expiresAt: data.expires_at,
      status,
      acceptedPaymentMethods: paymentMethodsForCurrency(data.currency),
    },
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Direct customer payment recording is disabled. Use a verified payment session.',
      code: 'DIRECT_PAYMENT_DISABLED',
    },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}

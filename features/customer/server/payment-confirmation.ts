import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('id, checkout_link_id, amount, currency, usdc_amount, status, method, stellar_tx_hash, created_at, description')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Only return completed payments on the confirmation page
    if (data.status !== 'completed') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const { data: checkoutLink, error: checkoutError } = data.checkout_link_id
      ? await supabase
          .from('checkout_links')
          .select('merchant_name')
          .eq('id', data.checkout_link_id)
          .maybeSingle()
      : { data: null, error: null };
    if (checkoutError) {
      console.error('[payment-confirmation] Failed to load merchant display name:', checkoutError.message);
      return NextResponse.json({ error: 'Unable to load payment confirmation' }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      usdcAmount: data.usdc_amount,
      status: data.status,
      method: data.method,
      stellarTxHash: data.stellar_tx_hash,
      createdAt: data.created_at,
      description: data.description,
      merchantName: checkoutLink?.merchant_name || 'Business',
    });
  } catch (error) {
    console.error('[payment-confirmation] Failed to load payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

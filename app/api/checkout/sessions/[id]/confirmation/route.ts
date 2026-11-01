import { NextResponse } from 'next/server';
import { arePaymentSessionsEnabled, formatCustomerAmount } from '@/features/customer/server/payment-sessions';
import { supabase } from '@/lib/supabase/server';
import { stellarTransactionUrl } from '@/lib/stellar-explorer';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Payment confirmation not found.' }, { status: 404 });
  }
  if (!arePaymentSessionsEnabled()) {
    return NextResponse.json(
      { error: 'Verified USDC payment confirmations are not available yet.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const { data: rows, error: sessionError } = await supabase.rpc('get_checkout_payment_session', {
    p_session_id: id,
    p_checkout_link_id: null,
  });

  if (sessionError) {
    console.error('[checkout] Could not verify payment session confirmation:', sessionError.message);
    return NextResponse.json({ error: 'Payment confirmation is temporarily unavailable.' }, { status: 503 });
  }
  const row = rows?.[0];
  const session = row ? {
    id: row.result_session_id as string,
    checkout_link_id: row.result_checkout_link_id as string,
    requested_amount: row.result_requested_amount as string | number,
    requested_currency: row.result_requested_currency as string,
    amount_units_1e7: row.result_amount_units_1e7 as string | number,
    asset_code: row.result_asset_code as string,
    status: row.result_status as string,
    network: row.result_network as string,
    paid_at: row.result_paid_at as string | null,
  } : null;
  if (!session || session.status !== 'paid' || !session.paid_at) {
    return NextResponse.json({ error: 'Payment has not been verified.' }, { status: 409 });
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, status, paid_with, stellar_tx_hash, created_at')
    .eq('payment_session_id', session.id)
    .maybeSingle();

  if (paymentError) {
    console.error('[checkout] Could not load verified payment:', paymentError.message);
    return NextResponse.json({ error: 'Payment confirmation is temporarily unavailable.' }, { status: 503 });
  }
  if (
    !payment
    || payment.status !== 'completed'
    || payment.paid_with !== session.asset_code
    || !payment.stellar_tx_hash
  ) {
    return NextResponse.json({ error: 'Payment has not been verified.' }, { status: 409 });
  }

  const { data: checkoutLink, error: checkoutError } = await supabase
    .from('checkout_links')
    .select('merchant_name')
    .eq('id', session.checkout_link_id)
    .maybeSingle();

  if (checkoutError) {
    console.error('[checkout] Could not load merchant display name:', checkoutError.message);
    return NextResponse.json({ error: 'Payment confirmation is temporarily unavailable.' }, { status: 503 });
  }

  return NextResponse.json({
    data: {
      id: payment.id,
      sessionId: session.id,
      merchantName: checkoutLink?.merchant_name || 'Business',
      invoiceAmount: Number(session.requested_amount).toFixed(2),
      invoiceCurrency: session.requested_currency,
      amount: formatCustomerAmount(session.amount_units_1e7),
      assetCode: session.asset_code,
      network: session.network,
      transactionHash: payment.stellar_tx_hash,
      createdAt: payment.created_at,
      explorerUrl: stellarTransactionUrl(session.network, payment.stellar_tx_hash),
    },
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}

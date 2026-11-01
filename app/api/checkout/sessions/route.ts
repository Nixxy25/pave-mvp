import { NextRequest, NextResponse } from 'next/server';
import { quoteFiatInUsdc } from '@/features/payments/server/exchange-rates';
import { arePaymentSessionsEnabled } from '@/features/customer/server/payment-sessions';
import { toCustomerSession } from '@/features/customer/server/session-view';
import { roundUpToCents } from '@/features/payments/stellar/amounts';
import { paymentMethodsForCurrency } from '@/features/payments/checkout-methods';
import { resolveStellarNetwork } from '@/features/payments/stellar/network';
import { supabase } from '@/lib/supabase/server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Configurable session lifetime; defaults to 15 minutes and is clamped to the
// range the database function accepts.
function sessionTtlSeconds(): number {
  const configured = Number(process.env.PAVE_PAYMENT_SESSION_TTL_SECONDS ?? 900);
  return Number.isInteger(configured) ? Math.min(3600, Math.max(60, configured)) : 900;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  if (
    !body
    || typeof body !== 'object'
    || Array.isArray(body)
    || !('checkoutLinkId' in body)
    || !('idempotencyKey' in body)
    || typeof body.checkoutLinkId !== 'string'
    || !UUID_PATTERN.test(body.checkoutLinkId)
    || typeof body.idempotencyKey !== 'string'
    || !UUID_PATTERN.test(body.idempotencyKey)
    || Object.keys(body).some((key) => !['checkoutLinkId', 'idempotencyKey', 'assetCode', 'network'].includes(key))
  ) {
    return NextResponse.json({ error: 'Invalid checkout session request.' }, { status: 400 });
  }
  if (('assetCode' in body && body.assetCode !== 'USDC')) {
    return NextResponse.json({ error: 'Only USDC payments are supported.' }, { status: 400 });
  }

  if (!arePaymentSessionsEnabled()) {
    return NextResponse.json(
      {
        error: 'Checkout is temporarily unavailable. Please try again shortly.',
        code: 'PAYMENT_SESSIONS_UNAVAILABLE',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  const network = resolveStellarNetwork().id;
  if ('network' in body && body.network !== network) {
    return NextResponse.json({ error: 'This network is not available yet.' }, { status: 400 });
  }

  const { data: link, error: linkError } = await supabase
    .from('checkout_links')
    .select('id, amount, currency, status, expires_at, accepted_payment_methods')
    .eq('id', body.checkoutLinkId)
    .maybeSingle();

  if (linkError) {
    console.error('[checkout] Could not read invoice for payment session:', linkError.message);
    return NextResponse.json({ error: 'Payment sessions are not configured.' }, { status: 503 });
  }
  if (!link) return NextResponse.json({ error: 'Checkout link not found.' }, { status: 404 });
  if (!paymentMethodsForCurrency(link.currency).includes('crypto')) {
    return NextResponse.json({ error: 'This invoice currency does not accept crypto payments yet.' }, { status: 409 });
  }
  if (link.status !== 'active' || new Date(link.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'This checkout link is no longer payable.' }, { status: 409 });
  }
  const invoiceAmount = Math.round(Number(link.amount) * 1_000_000) / 1_000_000;
  if (!Number.isFinite(invoiceAmount) || invoiceAmount <= 0) {
    return NextResponse.json({ error: 'This invoice does not have a payable amount.' }, { status: 409 });
  }

  let quote: { amount: number; usdPerInvoiceUnit: number; source: string };
  try {
    const usdc = await quoteFiatInUsdc(invoiceAmount, link.currency);
    quote = { amount: usdc.usdcAmount, usdPerInvoiceUnit: usdc.usdPerInvoiceUnit, source: usdc.source };
  } catch (error) {
    console.error('[checkout] Could not obtain a current USDC quote:', error);
    return NextResponse.json({ error: 'A current USDC quote is not available for this invoice.' }, { status: 503 });
  }

  // Integer arithmetic only: the exact quote, then the amount the customer must pay,
  // rounded UP to whole cents so the invoice is never under-quoted.
  const exactUnits = BigInt(Math.round(quote.amount * 10_000_000));
  if (exactUnits <= BigInt(0) || exactUnits > BigInt(Number.MAX_SAFE_INTEGER)) {
    return NextResponse.json({ error: 'The quoted amount is outside the supported precision.' }, { status: 422 });
  }
  const requiredUnits = roundUpToCents(exactUnits);
  const { data, error } = await supabase.rpc('create_payment_session', {
    p_checkout_link_id: link.id,
    p_idempotency_key: `checkout:${link.id}:USDC:${body.idempotencyKey}`,
    p_network: network,
    p_amount_units_1e7: Number(requiredUnits),
    p_exact_quote_units_1e7: Number(exactUnits),
    p_quote_rate: quote.usdPerInvoiceUnit.toPrecision(12),
    p_quote_source: quote.source,
    p_ttl_seconds: sessionTtlSeconds(),
  });

  if (error || !data?.length) {
    console.error('[checkout] Payment session RPC failed:', error?.message ?? 'No result returned.');
    const notReady = error?.message?.includes('wallet is not ready');
    if (notReady) {
      return NextResponse.json(
        { error: 'This merchant cannot accept payments yet.', code: 'MERCHANT_WALLET_NOT_READY' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return NextResponse.json(
      { error: 'Payment session infrastructure is not available.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const { data: rows, error: readError } = await supabase.rpc('get_checkout_payment_session', {
    p_session_id: data[0].result_session_id,
    p_checkout_link_id: link.id,
  });
  if (readError || !rows?.length) {
    console.error('[checkout] Could not load created payment session:', readError?.message);
    return NextResponse.json(
      { error: 'Payment session infrastructure is not available.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    { data: toCustomerSession(rows[0]) },
    { status: 201, headers: { 'Cache-Control': 'private, no-store' } },
  );
}

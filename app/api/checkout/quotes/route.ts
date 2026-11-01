import { NextRequest, NextResponse } from 'next/server';
import { quoteFiatInUsdc } from '@/features/payments/server/exchange-rates';
import { supabase } from '@/lib/supabase/server';
import { paymentMethodsForCurrency } from '@/features/payments/checkout-methods';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const QUOTE_TTL_MS = 30_000;

// Public estimate only. Creating a session is what locks the exact payable amount.
export async function GET(request: NextRequest) {
  const checkoutLinkId = request.nextUrl.searchParams.get('checkoutLinkId') ?? '';
  if (!UUID_PATTERN.test(checkoutLinkId)) {
    return NextResponse.json({ error: 'Invalid checkout quote request.' }, { status: 400 });
  }

  const { data: link, error } = await supabase
    .from('checkout_links')
    .select('id, amount, currency, status, expires_at, accepted_payment_methods')
    .eq('id', checkoutLinkId)
    .maybeSingle();
  if (error) {
    console.error('[checkout-quote] Could not read invoice:', error.message);
    return NextResponse.json({ error: 'A payment quote is not available.' }, { status: 503 });
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

  try {
    const usdc = await quoteFiatInUsdc(invoiceAmount, link.currency);
    const quotedAt = new Date();
    return NextResponse.json(
      {
        data: {
          usdcAmount: usdc.usdcAmount,
          quotedAt: quotedAt.toISOString(),
          expiresAt: new Date(quotedAt.getTime() + QUOTE_TTL_MS).toISOString(),
          source: usdc.source,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (cause) {
    console.error('[checkout-quote] Quote unavailable:', cause);
    return NextResponse.json({ error: 'A current payment quote is not available.' }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { arePaymentSessionsEnabled } from '@/features/customer/server/payment-sessions';
import { toCustomerSession } from '@/features/customer/server/session-view';
import { supabase } from '@/lib/supabase/server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const checkoutLinkId = request.nextUrl.searchParams.get('checkoutLinkId');
  if (!UUID_PATTERN.test(id) || !checkoutLinkId || !UUID_PATTERN.test(checkoutLinkId)) {
    return NextResponse.json({ error: 'Payment session not found.' }, { status: 404 });
  }
  if (!arePaymentSessionsEnabled()) {
    return NextResponse.json(
      { error: 'Payment session status is unavailable.', code: 'PAYMENT_SESSIONS_UNAVAILABLE' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const { data: rows, error } = await supabase.rpc('get_checkout_payment_session', {
    p_session_id: id,
    p_checkout_link_id: checkoutLinkId,
  });

  if (error) {
    console.error('[checkout] Could not load payment session:', error.message);
    return NextResponse.json({ error: 'Payment session status is unavailable.' }, { status: 503 });
  }
  const row = rows?.[0];
  if (!row) return NextResponse.json({ error: 'Payment session not found.' }, { status: 404 });

  return NextResponse.json({ data: toCustomerSession(row) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

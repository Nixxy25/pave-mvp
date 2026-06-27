import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/server-auth';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { amount, currency, description, acceptedCurrencies, settlementAsset } = body;

  // Verify the checkout link belongs to this user and is active
  const { data: existingLink, error: fetchError } = await supabase
    .from('checkout_links')
    .select('*')
    .eq('id', id)
    .eq('merchant_id', userId)
    .single();

  if (fetchError || !existingLink) {
    return NextResponse.json({ error: 'Checkout link not found' }, { status: 404 });
  }

  if (existingLink.status !== 'active') {
    return NextResponse.json({ error: 'Can only edit active checkout links' }, { status: 400 });
  }

  // Import the live exchange rate service to recalculate equivalents
  const { calculateEquivalents } = await import('@/lib/exchange-rates');

  // Calculate new equivalents using live rates
  const equivalents = await calculateEquivalents(amount, currency);

  // Update the checkout link
  const { data, error } = await supabase
    .from('checkout_links')
    .update({
      amount,
      currency,
      description,
      accepted_currencies: acceptedCurrencies,
      settlement_asset: settlementAsset,
      equivalents,
    })
    .eq('id', id)
    .eq('merchant_id', userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}

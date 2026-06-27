import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/server-auth';
import { supabase } from '@/lib/supabase';

// GET /api/checkout-links  → list merchant's checkout links
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('checkout_links')
    .select('*')
    .eq('merchant_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data || [] });
}

// POST /api/checkout-links  → create a new checkout link
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { amount, currency, description, acceptedCurrencies, settlementAsset,
          stellarWalletAddress, expiresInHours, merchantName, merchantPersonName } = body;

  // Import the live exchange rate service
  const { calculateEquivalents } = await import('@/lib/exchange-rates');

  // Calculate equivalents using live rates
  const equivalents = await calculateEquivalents(amount, currency);

  const expiresAt = expiresInHours
    ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('checkout_links')
    .insert({
      merchant_id: userId,
      merchant_name: merchantName || 'Business',
      merchant_person_name: merchantPersonName || '',
      merchant_verified: true,
      amount,
      currency,
      description,
      accepted_currencies: acceptedCurrencies,
      settlement_asset: settlementAsset,
      stellar_wallet_address: stellarWalletAddress || null,
      equivalents,
      expires_at: expiresAt,
      status: 'active',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}

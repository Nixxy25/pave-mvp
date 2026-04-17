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

  const conversionRates: Record<string, Record<string, number>> = {
    NGN: { GHS: 0.00427, USD: 0.00062, KES: 0.081 },
    USD: { GHS: 13.7, NGN: 1605, KES: 129.5 },
    GHS: { NGN: 234, USD: 0.073, KES: 9.45 },
    KES: { NGN: 12.3, USD: 0.0077, GHS: 0.106 },
  };

  const equivalents: Record<string, number> = { [currency]: amount };
  if (conversionRates[currency]) {
    for (const [target, rate] of Object.entries(conversionRates[currency])) {
      equivalents[target] = parseFloat((amount * rate).toFixed(2));
    }
  }

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

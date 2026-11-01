import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth/privy';
import { supabase } from '@/lib/supabase/server';
import { isInvoiceCurrency, paymentMethodsForCurrency } from '@/features/payments/checkout-methods';

const PAYMENT_METHODS = ['crypto', 'bank_transfer'] as const;

// Returns a de-duplicated, validated list, or null when it is empty or contains
// anything other than the supported payment methods.
export function parsePaymentMethods(value: unknown): Array<(typeof PAYMENT_METHODS)[number]> | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const unique = [...new Set(value)];
  return unique.every((method): method is (typeof PAYMENT_METHODS)[number] =>
    (PAYMENT_METHODS as readonly unknown[]).includes(method))
    ? unique
    : null;
}

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
  const { amount, currency, title, description, expiresInHours, merchantName, merchantPersonName } = body;
  const invoiceCurrency = typeof currency === 'string' ? currency.toUpperCase() : '';
  const paymentTitle = typeof title === 'string' ? title.trim() : '';
  const paymentDescription = typeof description === 'string' ? description.trim() : '';
  if (!isInvoiceCurrency(invoiceCurrency) || paymentTitle.length === 0 || paymentTitle.length > 120) {
    return NextResponse.json({ error: 'Enter a payment title and a supported invoice currency.' }, { status: 400 });
  }
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: 'Enter a valid invoice amount.' }, { status: 400 });
  }
  const paymentMethods = paymentMethodsForCurrency(invoiceCurrency);

  const hours = Number(expiresInHours);
  const expiresAt = hours > 0
    ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('checkout_links')
    .insert({
      merchant_id: userId,
      merchant_name: merchantName || 'Business',
      merchant_person_name: merchantPersonName || '',
      merchant_verified: true,
      amount,
      currency: invoiceCurrency,
      title: paymentTitle,
      description: paymentDescription || paymentTitle,
      accepted_currencies: [invoiceCurrency],
      settlement_asset: 'USDC',
      accepted_payment_methods: paymentMethods,
      expires_at: expiresAt,
      status: 'active',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}

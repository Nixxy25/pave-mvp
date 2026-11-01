import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth/privy';
import { supabase } from '@/lib/supabase/server';
import { isInvoiceCurrency, paymentMethodsForCurrency } from '@/features/payments/checkout-methods';

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
  const { amount, currency, title, description } = body;
  const invoiceCurrency = typeof currency === 'string' ? currency.toUpperCase() : '';
  const paymentTitle = typeof title === 'string' ? title.trim() : '';
  const paymentDescription = typeof description === 'string' ? description.trim() : '';
  if (!isInvoiceCurrency(invoiceCurrency) || paymentTitle.length === 0 || paymentTitle.length > 120) {
    return NextResponse.json({ error: 'Enter a payment title and a supported invoice currency.' }, { status: 400 });
  }
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: 'Enter a valid invoice amount.' }, { status: 400 });
  }

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

  // Update the checkout link
  const { data, error } = await supabase
    .from('checkout_links')
    .update({
      amount,
      currency: invoiceCurrency,
      title: paymentTitle,
      description: paymentDescription || paymentTitle,
      accepted_currencies: [invoiceCurrency],
      accepted_payment_methods: paymentMethodsForCurrency(invoiceCurrency),
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

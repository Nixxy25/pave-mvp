import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/server-auth';
import { supabase } from '@/lib/supabase';
import { getFiatRates } from '@/lib/exchange-rates';

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get('type') ?? 'list';

  if (type === 'byId') {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .eq('merchant_id', userId)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data });
  }

  if (type === 'balance') {
    const { data } = await supabase
      .from('payments')
      .select('usdc_amount')
      .eq('merchant_id', userId)
      .eq('status', 'completed');

    const totalIn = (data || []).reduce(
      (sum: number, p: { usdc_amount?: number }) => sum + (p.usdc_amount || 0),
      0,
    );

    // Get live exchange rate
    const rates = await getFiatRates();
    const usdToNgnRate = rates['NGN'] || 1605; // fallback to 1605 if API fails
    return NextResponse.json({ totalIn, usdToNgnRate });
  }

  if (type === 'stats') {
    const { data } = await supabase
      .from('payments')
      .select('usdc_amount, status')
      .eq('merchant_id', userId);

    const completed = (data || []).filter((p: { status: string }) => p.status === 'completed');
    const totalVolume = completed.reduce(
      (sum: number, p: { usdc_amount?: number }) => sum + (p.usdc_amount || 0),
      0,
    );

    return NextResponse.json({
      totalVolume,
      paymentCount: completed.length,
      conversionRate: completed.length > 0 ? 97.8 : 0,
      paveFee: totalVolume * 0.014,
      stellarFees: completed.length * 0.001,
      period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    });
  }

  // type === 'list'
  const status = req.nextUrl.searchParams.get('status');
  const search = req.nextUrl.searchParams.get('search');

  let query = supabase
    .from('payments')
    .select('*')
    .eq('merchant_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (search && search.trim()) {
    const searchTerm = search.trim();
    // Try to parse as number for amount search
    const numericSearch = parseFloat(searchTerm);
    
    if (!isNaN(numericSearch)) {
      // Search by name OR amount (numeric)
      query = query.or(`payer_name.ilike.%${searchTerm}%,amount.eq.${numericSearch}`);
    } else {
      // Search by name only (non-numeric)
      query = query.ilike('payer_name', `%${searchTerm}%`);
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error('Payment query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

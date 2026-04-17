import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/server-auth';
import { supabase } from '@/lib/supabase';
import { CONVERSION_RATES } from '@/lib/constants';

// GET /api/payments?type=list&status=&search=
// GET /api/payments?type=balance
// GET /api/payments?type=stats
// GET /api/payments?type=byId&id=xxx
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

    const usdToNgnRate = (CONVERSION_RATES as Record<string, Record<string, number>>)['USD']?.['NGN'] || 1605;
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

  if (status) query = query.eq('status', status);
  if (search) query = query.or(`payer_name.ilike.%${search}%,id.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data || [] });
}

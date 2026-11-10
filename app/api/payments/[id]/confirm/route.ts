import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('id, amount, currency, usdc_amount, status, method, stellar_tx_hash, created_at, description')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Only return completed payments on the confirmation page
    if (data.status !== 'completed') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    return NextResponse.json({
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      usdcAmount: data.usdc_amount,
      status: data.status,
      method: data.method,
      stellarTxHash: data.stellar_tx_hash,
      createdAt: data.created_at,
      description: data.description,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

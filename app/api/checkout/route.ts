import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { convertFiat, getXLMRate } from '@/lib/exchange-rates';
import { API_ENDPOINTS } from '@/lib/constants';

// GET /api/checkout?id=xxx  → public: fetch checkout link + merchant info
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data, error } = await supabase
    .from('checkout_links')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ data });
}

// POST /api/checkout  → public: complete a checkout payment
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { checkoutLinkId, customerName, paymentMethod, stellarTxHash } = body;

  if (!checkoutLinkId || !customerName || !paymentMethod) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }


  const { data: linkRow, error: linkError } = await supabase
    .from('checkout_links')
    .select('merchant_id, amount, currency, description, stellar_wallet_address, status')
    .eq('id', checkoutLinkId)
    .single();

  if (linkError || !linkRow) {
    return NextResponse.json({ error: 'Checkout link not found' }, { status: 404 });
  }

  if (linkRow.status !== 'active') {
    return NextResponse.json({ error: 'Checkout link is no longer active' }, { status: 400 });
  }

  const isStellar = paymentMethod === 'stellar';
  const baseAmount = linkRow.amount;
  const baseCurrency = linkRow.currency;


  let calculatedUsdcAmount: number;
  try {
    calculatedUsdcAmount = await convertFiat(baseAmount, baseCurrency, 'USD');
  } catch (error) {
    console.error('[checkout] Exchange rate calculation failed:', error);
    return NextResponse.json({ error: 'Unable to calculate payment amount' }, { status: 500 });
  }

  if (isStellar) {
    if (!stellarTxHash) {
      return NextResponse.json({ error: 'Stellar transaction hash required' }, { status: 400 });
    }

    if (!linkRow.stellar_wallet_address) {
      return NextResponse.json({ error: 'Merchant Stellar address not configured' }, { status: 400 });
    }

    try {
      // Dynamically import Stellar SDK to verify transaction
      const { Horizon } = await import('@stellar/stellar-sdk');
      const server = new Horizon.Server(API_ENDPOINTS.STELLAR_HORIZON_TESTNET);

      // Fetch transaction from Stellar network
      const txResponse = await server.transactions().transaction(stellarTxHash).call();

      // Verify transaction succeeded
      if (!txResponse.successful) {
        return NextResponse.json({ error: 'Stellar transaction failed on network' }, { status: 400 });
      }

      // Fetch operations to verify payment details
      const operations = await server.operations().forTransaction(stellarTxHash).call();
      const paymentOp = operations.records.find((op: any) => op.type === 'payment') as any;

      if (!paymentOp) {
        return NextResponse.json({ error: 'No payment operation found in transaction' }, { status: 400 });
      }

      if (paymentOp.to !== linkRow.stellar_wallet_address) {
        return NextResponse.json({ 
          error: 'Payment sent to wrong address',
          details: { expected: linkRow.stellar_wallet_address, received: paymentOp.to }
        }, { status: 400 });
      }

      // Verify payment asset is XLM (native)
      if (paymentOp.asset_type !== 'native') {
        return NextResponse.json({ error: 'Payment must be in XLM' }, { status: 400 });
      }

      // Verify payment amount (allow 2% tolerance for rate fluctuations during checkout)
      const xlmRate = await getXLMRate();
      const expectedXlmAmount = calculatedUsdcAmount / xlmRate;
      const actualXlmAmount = parseFloat(paymentOp.amount);
      const tolerance = 0.02; 

      if (Math.abs(actualXlmAmount - expectedXlmAmount) / expectedXlmAmount > tolerance) {
        return NextResponse.json({ 
          error: 'Payment amount mismatch',
          details: {
            expected: expectedXlmAmount.toFixed(7),
            received: actualXlmAmount.toFixed(7),
            tolerance: `${tolerance * 100}%`
          }
        }, { status: 400 });
      }

      // Check if transaction was already used for another payment
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('stellar_tx_hash', stellarTxHash)
        .single();

      if (existingPayment) {
        return NextResponse.json({ error: 'Transaction already used for payment' }, { status: 400 });
      }

    } catch (error: any) {
      console.error('[checkout] Stellar verification failed:', error);
      
      if (error.response?.status === 404) {
        return NextResponse.json({ error: 'Transaction not found on Stellar network' }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to verify Stellar transaction',
        details: error.message 
      }, { status: 400 });
    }
  }


  const { data: inserted, error } = await supabase
    .from('payments')
    .insert({
      merchant_id: linkRow.merchant_id,
      checkout_link_id: checkoutLinkId,
      payer_name: customerName.trim(),
      amount: baseAmount,
      currency: baseCurrency,
      usdc_amount: calculatedUsdcAmount,
      paid_with: isStellar ? 'XLM' : 'Visa Card',
      settled_amount: calculatedUsdcAmount,
      settled_currency: 'USDC',
      method: isStellar ? 'Stellar Wallet' : 'Card',
      source: 'Checkout',
      description: linkRow.description,
      status: 'completed',
      settled_at: new Date().toISOString(),
      ...(isStellar && stellarTxHash ? { stellar_tx_hash: stellarTxHash } : {}),
    })
    .select()
    .single();

  if (error) {
    console.error('[checkout] Database insert failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark checkout link as completed
  await supabase
    .from('checkout_links')
    .update({ status: 'completed' })
    .eq('id', checkoutLinkId);

  return NextResponse.json({ success: true, paymentId: inserted.id }, { status: 201 });
}

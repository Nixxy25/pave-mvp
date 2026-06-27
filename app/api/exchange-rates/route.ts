import { NextRequest, NextResponse } from 'next/server';
import { getFiatRates, getXLMRate, convertFiat, convertXLMToFiat, convertFiatToXLM } from '@/lib/exchange-rates';

/**
 * GET /api/exchange-rates
 * Returns live exchange rates for all supported currencies
 */
export async function GET() {
  try {
    const [fiatRates, xlmRate] = await Promise.all([
      getFiatRates(),
      getXLMRate(),
    ]);

    return NextResponse.json({
      fiat: {
        USD: fiatRates['USD'] || 1,
        NGN: fiatRates['NGN'] || 1605,
        GHS: fiatRates['GHS'] || 13.7,
        KES: fiatRates['KES'] || 129.5,
      },
      xlm: xlmRate,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[API] Failed to fetch exchange rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/exchange-rates/convert
 * Convert amount between currencies
 * Body: { amount: number, from: string, to: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { amount, from, to } = await req.json();

    if (!amount || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, from, to' },
        { status: 400 }
      );
    }

    let converted: number;

    if (from === 'XLM') {
      converted = await convertXLMToFiat(amount, to);
    } else if (to === 'XLM') {
      converted = await convertFiatToXLM(amount, from);
    } else {
      converted = await convertFiat(amount, from, to);
    }

    return NextResponse.json({
      amount,
      from,
      to,
      converted,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[API] Failed to convert currency:', error);
    return NextResponse.json(
      { error: 'Failed to convert currency' },
      { status: 500 }
    );
  }
}

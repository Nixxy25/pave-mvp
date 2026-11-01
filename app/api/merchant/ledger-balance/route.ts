import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth/privy';
import { getMerchantLedgerBalances } from '@/features/merchant/server/ledger';

export async function GET(request: NextRequest) {
  const merchantId = await getAuthenticatedUserId(request);
  if (!merchantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await getMerchantLedgerBalances(merchantId);
    if (!data) return NextResponse.json({ error: 'Merchant not found.' }, { status: 404 });
    return NextResponse.json(
      { data },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'Ledger balance is not available.', code: 'LEDGER_UNAVAILABLE' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

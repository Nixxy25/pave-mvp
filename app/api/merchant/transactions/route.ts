import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth/privy';
import { getMerchantFinancialTransactions } from '@/features/merchant/server/ledger';

const ALLOWED_STATUSES = new Set(['all', 'completed', 'pending', 'failed', 'expired']);

export async function GET(request: NextRequest) {
  const merchantId = await getAuthenticatedUserId(request);
  if (!merchantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const status = params.get('status') ?? 'all';
  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
  }
  const pageValue = Number(params.get('page') ?? '1');
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? Math.min(pageValue, 100000) : 1;

  try {
    const data = await getMerchantFinancialTransactions(merchantId, {
      page,
      status,
      search: params.get('search') ?? '',
    });
    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json(
      { error: 'Merchant transactions are unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}

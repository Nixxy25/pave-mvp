import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth/privy';
import { getMerchantFinancialTransactions } from '@/features/merchant/server/ledger';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const merchantId = await getAuthenticatedUserId(request);
  if (!merchantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });

  try {
    const result = await getMerchantFinancialTransactions(merchantId, { page: 1, search: id });
    const payment = result.rows.find((row) => row.paymentId === id);
    if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    return NextResponse.json({ data: payment }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json(
      { error: 'Merchant transaction is unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}

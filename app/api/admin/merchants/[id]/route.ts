import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { getAdminMerchant } from '@/features/admin/server/data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const url = new URL(request.url);
    const pageValue = Number(url.searchParams.get('page') ?? 1);
    const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? Math.min(pageValue, 100_000) : 1;
    const merchant = await getAdminMerchant(id, { page });
    if (!merchant) return NextResponse.json({ error: 'Merchant not found.' }, { status: 404 });
    return NextResponse.json({ merchant }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to load merchant.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { getAdminMerchants } from '@/features/admin/server/data';

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pageValue = Number(request.nextUrl.searchParams.get('page') ?? 1);
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? Math.min(pageValue, 100_000) : 1;

  try {
    return NextResponse.json(
      await getAdminMerchants({ page, search: request.nextUrl.searchParams.get('q') ?? '' }),
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Unable to load merchants.' }, { status: 500 });
  }
}

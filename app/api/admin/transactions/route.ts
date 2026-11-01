import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { getAdminTransactions } from '@/features/admin/server/data';

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const searchParams = request.nextUrl.searchParams;
  const pageValue = Number(searchParams.get('page') ?? 1);
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? Math.min(pageValue, 100_000) : 1;

  try {
    return NextResponse.json(
      await getAdminTransactions({
        page,
        search: searchParams.get('q') ?? '',
        status: searchParams.get('status') ?? '',
      }),
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Unable to load transactions.' }, { status: 500 });
  }
}

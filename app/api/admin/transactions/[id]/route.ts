import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { getAdminTransaction } from '@/features/admin/server/data';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const transaction = await getAdminTransaction(id);
    if (!transaction) return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
    return NextResponse.json({ transaction }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to load transaction.' }, { status: 500 });
  }
}

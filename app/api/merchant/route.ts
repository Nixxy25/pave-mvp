import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/server-auth';
import { supabase } from '@/lib/supabase';

// Removed generateKey function - API keys feature coming soon
// function generateKey(prefix: string) {
//   const rand = () => Math.random().toString(36).substring(2, 15);
//   return `${prefix}_${rand()}${rand()}`;
// }

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('privy_user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) return NextResponse.json({ merchant: null }, { status: 404 });

  return NextResponse.json({ merchant: data });
}

// POST /api/merchant — create merchant record on first login
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { email = '', full_name = '' } = body as { email?: string; full_name?: string };

  const { data, error } = await supabase
    .from('merchants')
    .insert({
      privy_user_id: userId,
      email,
      full_name,
      stellar_address: '',
      stellar_wallet_id: '',
      // API keys removed - Coming Soon feature
      // api_key: generateKey('pk_test'),
      // api_secret: generateKey('sk_test'),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ merchant: data }, { status: 201 });
}


export async function PATCH(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const allowed = ['full_name', 'email'] as const;
  const updates: Partial<Record<(typeof allowed)[number], string>> & { updated_at?: string } = {};

  for (const key of allowed) {
    if (typeof body[key] === 'string') updates[key] = body[key] as string;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('merchants')
    .update(updates)
    .eq('privy_user_id', userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ merchant: data });
}

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/server-auth';
import { supabase } from '@/lib/supabase';
import { API_ENDPOINTS, PRIVY_APP_ID } from '@/lib/constants';
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET!;

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const credentials = Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString('base64');

    // Create the Stellar server wallet in Privy, owned by this user
    const response = await fetch(`${API_ENDPOINTS.PRIVY_AUTH_BASE}/wallets`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'privy-app-id': PRIVY_APP_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chain_type: 'stellar',
        owner: { user_id: userId },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[stellar-wallet] Privy error:', err);
      return NextResponse.json({ error: 'Failed to create wallet' }, { status: response.status });
    }

    const wallet = await response.json();

    // Fund the new address on Stellar testnet via Friendbot so it exists on the ledger.
    await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(wallet.address)}`).catch(
      (err) => console.warn('[stellar-wallet] Friendbot funding failed (non-fatal):', err),
    );

    // Persist address + Privy wallet ID to the merchants table
    await supabase
      .from('merchants')
      .update({
        stellar_address: wallet.address,
        stellar_wallet_id: wallet.id,
        updated_at: new Date().toISOString(),
      })
      .eq('privy_user_id', userId);

    return NextResponse.json({ address: wallet.address as string, walletId: wallet.id as string });
  } catch (err) {
    console.error('[stellar-wallet] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth/privy';
import { supabase } from '@/lib/supabase/server';
import { ensureMerchantStellarWallet } from '@/features/wallets/provisioning';
import { resolveStellarNetwork } from '@/features/payments/stellar/network';

export const maxDuration = 60;

// Returns the merchant's permanent receiving wallet, provisioning it on first use.
// Only readiness is exposed to merchants; addresses and keys stay server-side.
export async function GET(request: NextRequest) {
  const merchantId = await getAuthenticatedUserId(request);
  if (!merchantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: merchant } = await supabase
    .from('merchants')
    .select('privy_user_id')
    .eq('privy_user_id', merchantId)
    .maybeSingle();
  if (!merchant) return NextResponse.json({ error: 'Merchant not found.' }, { status: 404 });

  const rpc = async (fn: string, args: Record<string, unknown>) => {
    const { data, error } = await supabase.rpc(fn, args);
    return { data, error: error ? { message: error.message, code: error.code } : null };
  };

  try {
    const network = resolveStellarNetwork();
    const wallet = await ensureMerchantStellarWallet(rpc, merchantId, network);
    return NextResponse.json(
      { data: { family: 'stellar', network: network.id, status: wallet.status } },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    console.error('[wallet] Provisioning failed:', (error as Error).message);
    return NextResponse.json(
      { error: 'Your receiving wallet is being set up. Please try again shortly.', code: 'WALLET_PROVISIONING' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

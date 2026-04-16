import { fetchUserAttributes } from 'aws-amplify/auth';
import { supabase } from '../supabase';
import { getCurrentUserId, rowToCheckoutLink } from './helpers';
import { logAPICall } from './logs';
import type { CheckoutLink, CreatePaymentData } from '@/types';

export async function getCheckoutLinks(): Promise<CheckoutLink[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data } = await supabase
    .from('checkout_links')
    .select('*')
    .eq('merchant_id', userId)
    .order('created_at', { ascending: false });

  return (data || []).map(rowToCheckoutLink);
}

export async function getCheckoutLinkById(id: string): Promise<CheckoutLink | null> {
  const { data } = await supabase.from('checkout_links').select('*').eq('id', id).single();
  return data ? rowToCheckoutLink(data) : null;
}

export async function createPayment(data: CreatePaymentData): Promise<CheckoutLink> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const conversionRates: Record<string, Record<string, number>> = {
    NGN: { GHS: 0.00427, USD: 0.00062, KES: 0.081, XOF: 0.365 },
    USD: { GHS: 13.7, NGN: 1605, KES: 129.5, XOF: 585 },
    GHS: { NGN: 234, USD: 0.073, KES: 9.45, XOF: 42.7 },
    KES: { NGN: 12.3, USD: 0.0077, GHS: 0.106, XOF: 4.52 },
    XOF: { NGN: 2.74, USD: 0.0017, GHS: 0.0234, KES: 0.221 },
  };

  const equivalents: Record<string, number> = { [data.currency]: data.amount };
  if (conversionRates[data.currency]) {
    for (const [target, rate] of Object.entries(conversionRates[data.currency])) {
      equivalents[target] = parseFloat((data.amount * rate).toFixed(2));
    }
  }

  const attrs = (await fetchUserAttributes().catch(() => ({}))) as Record<string, string>;
  const merchantName = attrs.nickname || 'Business';
  const merchantPersonName = attrs.name || '';

  const expiresAt = data.expiresInHours
    ? new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: inserted, error } = await supabase
    .from('checkout_links')
    .insert({
      merchant_id: userId,
      merchant_name: merchantName,
      merchant_person_name: merchantPersonName,
      merchant_verified: true,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      accepted_currencies: data.acceptedCurrencies,
      settlement_asset: data.settlementAsset,
      stellar_wallet_address: data.stellarWalletAddress || null,
      equivalents,
      expires_at: expiresAt,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAPICall('POST', '/v1/payments', 201, JSON.stringify(data));

  return rowToCheckoutLink(inserted);
}

export async function getMerchantInfo(
  checkoutLinkId?: string,
): Promise<{ name: string; personName: string; country: string; verified: boolean } | null> {
  // Public checkout page: read from checkout_link row (no auth needed)
  if (checkoutLinkId) {
    const { data } = await supabase
      .from('checkout_links')
      .select('merchant_name, merchant_person_name, merchant_verified')
      .eq('id', checkoutLinkId)
      .single();
    if (data) {
      return {
        name: data.merchant_name || 'Business',
        personName: data.merchant_person_name || '',
        country: 'Nigeria',
        verified: data.merchant_verified ?? true,
      };
    }
    return null;
  }

  // Logged-in dashboard: read from Cognito
  if (typeof window === 'undefined') return null;
  try {
    const attributes = await fetchUserAttributes();
    return {
      name: attributes.nickname || 'Business',
      personName: attributes.name || '',
      country: 'Nigeria',
      verified: true,
    };
  } catch {
    return null;
  }
}

export async function completeCheckoutPayment(data: {
  checkoutLinkId: string;
  customerName: string;
  amount: number;
  currency: string;
  usdcAmount: number;
  description: string;
  paymentMethod: 'card' | 'stellar';
  stellarTxHash?: string;
}): Promise<{ success: boolean; paymentId: string }> {
  if (typeof window === 'undefined') throw new Error('Cannot complete payment on server');

  const { data: linkRow } = await supabase
    .from('checkout_links')
    .select('merchant_id')
    .eq('id', data.checkoutLinkId)
    .single();

  if (!linkRow) throw new Error('Checkout link not found');

  const countryMap: Record<string, string> = {
    GHS: 'GH', KES: 'KE', XOF: 'SN', NGN: 'NG', USD: 'US', XLM: 'US',
  };

  const isStellar = data.paymentMethod === 'stellar';

  const { data: inserted, error } = await supabase
    .from('payments')
    .insert({
      merchant_id: linkRow.merchant_id,
      checkout_link_id: data.checkoutLinkId,
      payer_name: data.customerName,
      payer_country: countryMap[data.currency] || 'NG',
      amount: data.amount,
      currency: data.currency,
      usdc_amount: data.usdcAmount,
      paid_with: isStellar ? 'XLM' : 'Visa Card',
      settled_amount: data.usdcAmount,
      settled_currency: 'USDC',
      method: isStellar ? 'Stellar Wallet' : 'Card',
      source: 'Checkout',
      description: data.description,
      status: 'completed',
      settled_at: new Date().toISOString(),
      ...(isStellar && data.stellarTxHash ? { stellar_tx_hash: data.stellarTxHash } : {}),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from('checkout_links')
    .update({ status: 'completed' })
    .eq('id', data.checkoutLinkId);

  return { success: true, paymentId: inserted.id };
}

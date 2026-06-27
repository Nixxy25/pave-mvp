import { rowToCheckoutLink } from './helpers';
import { logAPICall } from './logs';
import { authFetch } from '../fetch-api';
import type { CheckoutLink, CreatePaymentData } from '@/types';

export async function getCheckoutLinks(): Promise<CheckoutLink[]> {
  const res = await authFetch('/api/checkout-links');
  if (!res.ok) return [];
  const { data } = await res.json();
  return (data || []).map(rowToCheckoutLink);
}

export async function getCheckoutLinkById(id: string): Promise<CheckoutLink | null> {
  const res = await fetch(`/api/checkout?id=${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  const { data } = await res.json();
  return data ? rowToCheckoutLink(data) : null;
}

export async function createPayment(data: CreatePaymentData): Promise<CheckoutLink> {
  // Get merchant info from Supabase via API
  const merchantRes = await authFetch('/api/merchant').catch(() => null);
  let merchantName = 'Business';
  let merchantPersonName = '';
  if (merchantRes?.ok) {
    const { merchant } = await merchantRes.json();
    merchantName = merchant?.full_name || 'Business';
    merchantPersonName = merchant?.full_name || '';
  }

  const res = await authFetch('/api/checkout-links', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      merchantName,
      merchantPersonName,
    }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || 'Failed to create checkout link');
  }

  const { data: inserted } = await res.json();
  await logAPICall('POST', '/v1/payments', 201, JSON.stringify(data));
  return rowToCheckoutLink(inserted);
}

export async function getMerchantInfo(
  checkoutLinkId?: string,
): Promise<{ name: string; personName: string; verified: boolean } | null> {
  if (checkoutLinkId) {
    const res = await fetch(`/api/checkout?id=${encodeURIComponent(checkoutLinkId)}`);
    if (!res.ok) return null;
    const { data } = await res.json();
    if (data) {
      return {
        name: data.merchant_name || 'Business',
        personName: data.merchant_person_name || '',
        verified: data.merchant_verified ?? true,
      };
    }
    return null;
  }

  // Logged-in dashboard: read from Supabase via API
  if (typeof window === 'undefined') return null;
  try {
    const res = await authFetch('/api/merchant');
    if (!res.ok) return null;
    const { merchant } = await res.json();
    return {
      name: merchant?.full_name || 'Business',
      personName: merchant?.full_name || '',
      verified: true,
    };
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SECURITY: Server calculates all amounts - client only sends checkout ID and method
// ──────────────────────────────────────────────────────────────────────────────
export async function completeCheckoutPayment(data: {
  checkoutLinkId: string;
  customerName: string;
  paymentMethod: 'card' | 'stellar';
  stellarTxHash?: string;
}): Promise<{ success: boolean; paymentId: string }> {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const { error, details } = await res.json();
    console.error('[completeCheckoutPayment] Error:', error, details);
    throw new Error(error || 'Failed to complete payment');
  }

  return res.json();
}

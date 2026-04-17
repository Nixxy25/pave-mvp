import { fetchUserAttributes } from 'aws-amplify/auth';
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
  const attrs = (await fetchUserAttributes().catch(() => ({}))) as Record<string, string>;
  const merchantName = attrs.nickname || 'Business';
  const merchantPersonName = attrs.name || '';

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
): Promise<{ name: string; personName: string; country: string; verified: boolean } | null> {
  // Public checkout page: read from checkout_link row via API (no auth needed)
  if (checkoutLinkId) {
    const res = await fetch(`/api/checkout?id=${encodeURIComponent(checkoutLinkId)}`);
    if (!res.ok) return null;
    const { data } = await res.json();
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
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || 'Failed to complete payment');
  }

  return res.json();
}

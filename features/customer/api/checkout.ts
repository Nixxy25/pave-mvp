import { rowToCheckoutLink } from '@/features/payments/mappers';
import type { CheckoutLink } from '@/types';

export async function getCheckoutLinkById(id: string): Promise<CheckoutLink | null> {
  const res = await fetch(`/api/checkout?id=${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  const { data } = await res.json();
  return data ? rowToCheckoutLink(data) : null;
}

export async function getMerchantInfo(
  checkoutLinkId: string,
): Promise<{ name: string; personName: string; verified: boolean } | null> {
  const res = await fetch(`/api/checkout?id=${encodeURIComponent(checkoutLinkId)}`);
  if (!res.ok) return null;
  const { data } = await res.json();
  if (!data) return null;
  return {
    name: data.merchant_name || 'Business',
    personName: data.merchant_person_name || '',
    verified: data.merchant_verified ?? true,
  };
}

// SECURITY: The server calculates all amounts; the client only sends the checkout ID and method.
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

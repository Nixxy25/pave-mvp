import { authFetch } from '@/lib/fetch-api';
import { rowToCheckoutLink } from '@/features/payments/mappers';
import { logAPICall } from './logs';
import type { CheckoutLink, CreatePaymentData } from '@/types';

export async function getCheckoutLinks(): Promise<CheckoutLink[]> {
  const res = await authFetch('/api/checkout-links');
  if (!res.ok) return [];
  const { data } = await res.json();
  return (data || []).map(rowToCheckoutLink);
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

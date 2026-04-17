import { authFetch } from '../fetch-api';
import { rowToPayment } from './helpers';
import type { Payment, PaymentFilters } from '@/types';

export async function getPayments(filters?: PaymentFilters): Promise<Payment[]> {
  const params = new URLSearchParams({ type: 'list' });
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);

  const res = await authFetch(`/api/payments?${params}`);
  if (!res.ok) return [];
  const { data } = await res.json();
  return (data || []).map(rowToPayment);
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  const res = await authFetch(`/api/payments?type=byId&id=${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  const { data } = await res.json();
  return data ? rowToPayment(data) : null;
}

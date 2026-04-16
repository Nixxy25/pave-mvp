import { supabase } from '../supabase';
import { getCurrentUserId, rowToPayment } from './helpers';
import type { Payment, PaymentFilters } from '@/types';

export async function getPayments(filters?: PaymentFilters): Promise<Payment[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  let query = supabase
    .from('payments')
    .select('*')
    .eq('merchant_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.or(`payer_name.ilike.%${filters.search}%,id.ilike.%${filters.search}%`);
  }

  const { data } = await query;
  return (data || []).map(rowToPayment);
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  const { data } = await supabase.from('payments').select('*').eq('id', id).single();
  return data ? rowToPayment(data) : null;
}

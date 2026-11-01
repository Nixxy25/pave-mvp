import 'server-only';

import { supabase } from '@/lib/supabase/server';
import { formatUsdcUnits } from '@/features/customer/server/payment-sessions';

export type EngineData<T> = { status: 'ok'; data: T } | { status: 'unavailable' };

export interface WebhookHealthRow {
  network: string;
  lastReceivedAt: string | null;
  lastProcessedAt: string | null;
  lastFailedAt: string | null;
  received24h: number;
  failed24h: number;
}

export interface ReconciliationRow {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  paymentSessionId: string | null;
  transactionHash: string;
  network: string;
  amount: string;
}

export interface EngineSummary {
  readyWallets: number;
  failedWallets: number;
  openSessions: number;
  paidSessions: number;
  openReconciliation: number;
  totalReceived: string;
}

// Unavailable is reported as unavailable, never as zero.
export async function getEngineSummary(): Promise<EngineData<EngineSummary>> {
  const { data, error } = await supabase.rpc('admin_payment_engine_summary');
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return { status: 'unavailable' };
  return {
    status: 'ok',
    data: {
      readyWallets: Number(row.result_ready_wallets),
      failedWallets: Number(row.result_failed_wallets),
      openSessions: Number(row.result_open_sessions),
      paidSessions: Number(row.result_paid_sessions),
      openReconciliation: Number(row.result_open_reconciliation),
      totalReceived: formatUsdcUnits(row.result_total_received_units_1e7),
    },
  };
}

export async function getWebhookHealth(): Promise<EngineData<WebhookHealthRow[]>> {
  const { data, error } = await supabase.rpc('get_webhook_health');
  if (error || !data) return { status: 'unavailable' };
  return {
    status: 'ok',
    data: data.map((row: {
      result_network: string; result_last_received_at: string | null; result_last_processed_at: string | null;
      result_last_failed_at: string | null; result_received_24h: number | string; result_failed_24h: number | string;
    }) => ({
      network: row.result_network,
      lastReceivedAt: row.result_last_received_at,
      lastProcessedAt: row.result_last_processed_at,
      lastFailedAt: row.result_last_failed_at,
      received24h: Number(row.result_received_24h),
      failed24h: Number(row.result_failed_24h),
    })),
  };
}

export async function getReconciliationItems(limit = 50): Promise<EngineData<ReconciliationRow[]>> {
  const { data, error } = await supabase.rpc('admin_list_reconciliation_items', { p_limit: limit });
  if (error || !data) return { status: 'unavailable' };
  return {
    status: 'ok',
    data: data.map((row: {
      result_id: string; result_reason: string; result_status: string; result_created_at: string;
      result_payment_session_id: string | null; result_transaction_hash: string;
      result_amount_units_1e7: string | number; result_network: string;
    }) => ({
      id: row.result_id,
      reason: row.result_reason,
      status: row.result_status,
      createdAt: row.result_created_at,
      paymentSessionId: row.result_payment_session_id,
      transactionHash: row.result_transaction_hash,
      network: row.result_network,
      amount: formatUsdcUnits(row.result_amount_units_1e7),
    })),
  };
}

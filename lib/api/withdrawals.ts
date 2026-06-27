// import { authFetch } from '../fetch-api';
// import { logAPICall } from './logs';
import type { Withdrawal, CreateWithdrawalData } from '@/types';

// ──────────────────────────────────────────────────────────────────────────────
// WITHDRAWALS FEATURE: COMING SOON
// These functions are disabled until the withdrawal feature is ready for launch
// ──────────────────────────────────────────────────────────────────────────────

// Disabled - Coming Soon
// function rowToWithdrawal(row: Record<string, unknown>): Withdrawal {
//   return {
//     id: row.id as string,
//     amount: row.amount as number,
//     currency: row.currency as string,
//     destination: {
//       id: `bank_${row.id as string}`,
//       bankName: row.bank_name as string,
//       bankCode: row.bank_code as string,
//       accountNumber: row.account_number as string,
//       accountName: row.account_name as string,
//     },
//     narration: row.narration as string | undefined,
//     stellarTxHash: row.stellar_tx_hash as string | undefined,
//     status: row.status as Withdrawal['status'],
//     createdAt: row.created_at as string,
//     estimatedArrival: row.estimated_arrival as string | undefined,
//   };
// }

// Disabled - Coming Soon
export async function getWithdrawals(): Promise<Withdrawal[]> {
  return []; // Return empty array until feature is ready
  // const res = await authFetch('/api/withdrawals');
  // if (!res.ok) return [];
  // const { data } = await res.json();
  // return (data || []).map(rowToWithdrawal);
}

// Disabled - Coming Soon
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createWithdrawal(_data: CreateWithdrawalData): Promise<Withdrawal> {
  throw new Error('Withdrawals feature is coming soon');
  // const res = await authFetch('/api/withdrawals', {
  //   method: 'POST',
  //   body: JSON.stringify(data),
  // });
  // if (!res.ok) {
  //   const { error } = await res.json();
  //   throw new Error(error || 'Failed to create withdrawal');
  // }
  // const { data: created } = await res.json();
  // await logAPICall('POST', '/v1/payouts', 201, JSON.stringify(data));
  // return rowToWithdrawal(created);
}


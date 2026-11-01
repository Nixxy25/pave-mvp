import 'server-only';

import { checkoutStatusFromSession, formatCustomerAmount } from './payment-sessions';

export interface SessionRow {
  result_session_id: string;
  result_checkout_link_id: string;
  result_requested_amount: string | number;
  result_requested_currency: string;
  result_amount_units_1e7: string | number;
  result_asset_code: string;
  result_network: string;
  result_receiving_address: string;
  result_memo: string;
  result_created_at: string;
  result_expires_at: string;
  result_status: string;
  result_transaction_hash: string | null;
}

// The only shape ever returned to a customer. The payment is matched by the
// receiving address plus the required memo; merchant identifiers are never exposed.
export function toCustomerSession(row: SessionRow) {
  const status = checkoutStatusFromSession(row.result_status, row.result_expires_at);
  const canPay = status === 'awaiting_payment' || status === 'verifying';
  return {
    id: row.result_session_id,
    checkoutLinkId: row.result_checkout_link_id,
    amount: formatCustomerAmount(row.result_amount_units_1e7),
    invoiceAmount: Number(row.result_requested_amount).toFixed(2),
    invoiceCurrency: row.result_requested_currency,
    assetCode: row.result_asset_code,
    network: row.result_network,
    destinationAddress: canPay ? row.result_receiving_address : null,
    memo: canPay ? row.result_memo : null,
    createdAt: row.result_created_at,
    expiresAt: row.result_expires_at,
    status,
  };
}

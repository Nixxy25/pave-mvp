import { resolveStellarNetwork } from '@/features/payments/stellar/network';

// Release gate for customer-facing USDC payment instructions: the network config must be valid and the flag on.
export function arePaymentSessionsEnabled(): boolean {
  try {
    resolveStellarNetwork();
  } catch (error) {
    console.error('[payments] Misconfigured Stellar network:', (error as Error).message);
    return false;
  }
  return process.env.PAVE_CHECKOUT_SESSIONS_ENABLED === 'true';
}

export function formatUsdcUnits(value: string | number): string {
  const units = String(value);
  if (!/^\d+$/.test(units)) throw new Error('Invalid USDC amount units returned by the database.');
  const normalized = units.replace(/^0+(?=\d)/, '');
  const whole = normalized.length > 7 ? normalized.slice(0, -7) : '0';
  const fraction = normalized.slice(-7).padStart(7, '0');
  return `${whole}.${fraction}`;
}

// Customer-facing amounts are whole cents (the required amount is rounded up to cents
// at quote time); anything finer is shown in full rather than silently truncated.
export function formatCustomerAmount(value: string | number): string {
  const full = formatUsdcUnits(value);
  return full.endsWith('00000') ? full.slice(0, -5) : full;
}

export function checkoutStatusFromSession(status: string, expiresAt: string) {
  if (['pending', 'confirming'].includes(status) && new Date(expiresAt).getTime() <= Date.now()) {
    return 'expired' as const;
  }
  if (status === 'pending') return 'awaiting_payment' as const;
  if (status === 'confirming') return 'verifying' as const;
  if (status === 'paid') return 'completed' as const;
  if (status === 'expired') return 'expired' as const;
  return 'payment_issue' as const;
}

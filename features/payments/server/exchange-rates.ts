import { API_ENDPOINTS } from '@/lib/constants';

// USD invoices are quoted 1:1 in USDC. Other currencies are disabled for now but stay quotable for later.
export async function quoteFiatInUsdc(amount: number, currency: string): Promise<{
  usdcAmount: number;
  usdPerInvoiceUnit: number;
  source: string;
}> {
  if (!Number.isFinite(amount) || amount <= 0 || !/^[A-Z]{3}$/.test(currency)) {
    throw new Error('A positive invoice amount and supported currency are required.');
  }

  if (currency === 'USD') {
    return {
      usdcAmount: Math.round(amount * 10_000_000) / 10_000_000,
      usdPerInvoiceUnit: 1,
      source: 'USD invoice amount; USDC quoted at 1:1',
    };
  }

  const response = await fetch(API_ENDPOINTS.FIAT_EXCHANGE_RATES, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Exchange-rate provider returned HTTP ${response.status}.`);

  const data = await response.json() as {
    result?: string;
    time_last_update_utc?: string;
    rates?: Record<string, number>;
  };
  const unitsPerUsd = Number(data.rates?.[currency]);
  if (data.result !== 'success') {
    throw new Error('Exchange-rate provider did not return a successful quote.');
  }
  if (!Number.isFinite(unitsPerUsd) || unitsPerUsd <= 0) {
    throw new Error(`No current exchange rate is available for ${currency}.`);
  }

  const usdPerInvoiceUnit = 1 / unitsPerUsd;
  const usdcAmount = Math.round(amount * usdPerInvoiceUnit * 10_000_000) / 10_000_000;
  if (!Number.isFinite(usdcAmount) || usdcAmount <= 0) {
    throw new Error('The invoice amount is too small to quote in USDC.');
  }

  return {
    usdcAmount,
    usdPerInvoiceUnit,
    source: `open.er-api.com${data.time_last_update_utc ? ` (${data.time_last_update_utc})` : ''}`,
  };
}

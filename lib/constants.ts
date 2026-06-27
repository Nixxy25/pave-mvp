// Application constants and helper functions


export const SUPPORTED_CURRENCIES = ['GHS', 'USD', 'KES', 'NGN'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export const CURRENCY_NAMES: Record<SupportedCurrency, string> = {
  'GHS': 'Ghanaian Cedi',
  'USD': 'US Dollar',
  'KES': 'Kenyan Shilling',
  'NGN': 'Nigerian Naira',
};

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  'GHS': '₵',
  'USD': '$',
  'KES': 'KSh',
  'NGN': '₦',
};

export const CURRENCY_COUNTRIES: Record<SupportedCurrency, string> = {
  'GHS': 'GH',
  'KES': 'KE',
  'NGN': 'NG',
  'USD': 'US',
};

export const CONVERSION_RATES: Record<SupportedCurrency, Partial<Record<SupportedCurrency, number>>> = {
  'NGN': { 'GHS': 0.00427, 'USD': 0.00062, 'KES': 0.081 },
  'USD': { 'GHS': 13.7, 'NGN': 1605, 'KES': 129.5 },
  'GHS': { 'NGN': 234, 'USD': 0.073, 'KES': 9.45 },
  'KES': { 'NGN': 12.3, 'USD': 0.0077, 'GHS': 0.106 },
};

// NOTE: CONVERSION_RATES above are fallback/legacy values.
// For live rates, use the functions from @/lib/exchange-rates instead.

export function getCurrencyName(code: string): string {
  return CURRENCY_NAMES[code as SupportedCurrency] || code;
}

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code as SupportedCurrency] || code;
}

export function formatCurrency(amount: number, currency: string): string {
  return `${getCurrencySymbol(currency)} ${amount.toLocaleString()}`;
}

export function isSupportedCurrency(code: string): code is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(code as SupportedCurrency);
}

/**
 * Calculate equivalent amounts in all supported currencies
 * @deprecated Use calculateEquivalents from @/lib/exchange-rates for live rates
 */
export function calculateEquivalents(
  baseAmount: number,
  baseCurrency: string
): Record<string, number> {
  const equivalents: Record<string, number> = {};
  equivalents[baseCurrency] = baseAmount;
  
  const rates = CONVERSION_RATES[baseCurrency as SupportedCurrency];
  if (rates) {
    Object.entries(rates).forEach(([targetCurrency, rate]) => {
      if (rate) {
        equivalents[targetCurrency] = parseFloat((baseAmount * rate).toFixed(2));
      }
    });
  }
  
  return equivalents;
}

export function getCountryFromCurrency(currency: string): string {
  return CURRENCY_COUNTRIES[currency as SupportedCurrency] || 'NG';
}

// Application constants and helper functions

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;


export const API_ENDPOINTS = {
  // Exchange Rate APIs
  FIAT_EXCHANGE_RATES: 'https://open.er-api.com/v6/latest/USD',
  XLM_PRICE: 'https://api.binance.com/api/v3/ticker/price?symbol=XLMUSDT',
  
  // Stellar Network
  STELLAR_HORIZON_TESTNET: 'https://horizon-testnet.stellar.org',
  STELLAR_EXPLORER_TESTNET: 'https://stellar.expert/explorer/testnet',
  
  PRIVY_AUTH_BASE: 'https://auth.privy.io/api/v1',
} as const;



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

// NOTE: For live exchange rates, use the functions from @/lib/exchange-rates

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

export function getCountryFromCurrency(currency: string): string {
  return CURRENCY_COUNTRIES[currency as SupportedCurrency] || 'NG';
}

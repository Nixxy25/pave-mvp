

import { SupportedCurrency } from './constants';

// --- Fiat Exchange Rates ---

interface FiatRatesCache {
  rates: Record<string, number> | null;
  timestamp: number;
}

const fiatCache: FiatRatesCache = {
  rates: null,
  timestamp: 0,
};

// Cache fiat rates for 5 minutes
const FIAT_CACHE_TTL = 5 * 60 * 1000;

// Fallback rates if API fails (based on current market rates)
const FALLBACK_FIAT_RATES: Record<string, number> = {
  USD: 1,
  NGN: 1605,
  GHS: 13.7,
  KES: 129.5,
};


async function fetchFiatRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 300 }, // Cache in Next.js for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result !== 'success' || !data.rates) {
      throw new Error('Invalid API response');
    }

    return data.rates;
  } catch (error) {
    console.error('[exchange-rates] Failed to fetch fiat rates:', error);
    return FALLBACK_FIAT_RATES;
  }
}

/**
 * Get cached or fresh fiat rates
 */
export async function getFiatRates(): Promise<Record<string, number>> {
  const now = Date.now();

  // Return cached rates if still fresh
  if (fiatCache.rates && now - fiatCache.timestamp < FIAT_CACHE_TTL) {
    return fiatCache.rates;
  }

  // Fetch fresh rates
  const rates = await fetchFiatRates();
  fiatCache.rates = rates;
  fiatCache.timestamp = now;

  return rates;
}

/**
 * Convert an amount from one fiat currency to another
 */
export async function convertFiat(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to) return amount;

  const rates = await getFiatRates();
  const fromRate = rates[from] || FALLBACK_FIAT_RATES[from] || 1;
  const toRate = rates[to] || FALLBACK_FIAT_RATES[to] || 1;

  // Convert: amount in 'from' → USD → 'to'
  const usdAmount = amount / fromRate;
  const result = usdAmount * toRate;

  return parseFloat(result.toFixed(2));
}

// --- XLM Exchange Rates ---

interface XLMRateCache {
  rate: number | null;
  timestamp: number;
}

const xlmCache: XLMRateCache = {
  rate: null,
  timestamp: 0,
};

// Cache XLM rate for 30 seconds
const XLM_CACHE_TTL = 30 * 1000;

// Fallback XLM/USD rate
const FALLBACK_XLM_RATE = 0.11;

/**
 * Fetch current XLM/USDT price from Binance API
 */
async function fetchXLMRate(): Promise<number> {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=XLMUSDT', {
      next: { revalidate: 30 }, // Cache in Next.js for 30 seconds
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.price) {
      throw new Error('Invalid API response');
    }

    return parseFloat(data.price);
  } catch (error) {
    console.error('[exchange-rates] Failed to fetch XLM rate:', error);
    return FALLBACK_XLM_RATE;
  }
}

/**
 * Get current XLM/USD rate
 * Returns live rate with caching or falls back to default rate
 */
export async function getXLMRate(): Promise<number> {
  const now = Date.now();

  // Return cached rate if still fresh
  if (xlmCache.rate && now - xlmCache.timestamp < XLM_CACHE_TTL) {
    return xlmCache.rate;
  }

  // Fetch fresh rate
  const rate = await fetchXLMRate();
  xlmCache.rate = rate;
  xlmCache.timestamp = now;

  return rate;
}

/**
 * Convert XLM to a fiat currency
 * @param xlmAmount - Amount in XLM
 * @param targetCurrency - Target fiat currency (NGN, GHS, KES, USD)
 */
export async function convertXLMToFiat(
  xlmAmount: number,
  targetCurrency: string
): Promise<number> {
  // Get XLM → USD rate
  const xlmUsdRate = await getXLMRate();
  const usdAmount = xlmAmount * xlmUsdRate;

  // If target is USD, we're done
  if (targetCurrency === 'USD') {
    return parseFloat(usdAmount.toFixed(2));
  }

  // Convert USD → target currency
  return await convertFiat(usdAmount, 'USD', targetCurrency);
}

/**
 * Convert fiat to XLM
 * @param fiatAmount - Amount in fiat currency
 * @param fromCurrency - Source fiat currency (NGN, GHS, KES, USD)
 */
export async function convertFiatToXLM(
  fiatAmount: number,
  fromCurrency: string
): Promise<number> {
  // Convert fiat → USD
  const usdAmount = await convertFiat(fiatAmount, fromCurrency, 'USD');

  // Convert USD → XLM
  const xlmUsdRate = await getXLMRate();
  const xlmAmount = usdAmount / xlmUsdRate;

  return parseFloat(xlmAmount.toFixed(7)); // XLM has 7 decimal places
}

// --- Multi-Currency Conversion ---

/**
 * Calculate equivalent amounts in all supported currencies
 * @param baseAmount - Amount in base currency
 * @param baseCurrency - Base currency code (USD, NGN, GHS, KES, XLM)
 * @returns Object with currency codes as keys and equivalent amounts as values
 */
export async function calculateEquivalents(
  baseAmount: number,
  baseCurrency: string
): Promise<Record<string, number>> {
  const equivalents: Record<string, number> = {};
  const supportedFiats: SupportedCurrency[] = ['USD', 'NGN', 'GHS', 'KES'];

  // Start with the base currency
  equivalents[baseCurrency] = baseAmount;

  try {
    if (baseCurrency === 'XLM') {
      // Convert XLM to all fiat currencies
      for (const fiat of supportedFiats) {
        equivalents[fiat] = await convertXLMToFiat(baseAmount, fiat);
      }
    } else {
      // Convert fiat to all other fiat currencies
      for (const fiat of supportedFiats) {
        if (fiat !== baseCurrency) {
          equivalents[fiat] = await convertFiat(baseAmount, baseCurrency, fiat);
        }
      }

      // Also calculate XLM equivalent
      equivalents['XLM'] = await convertFiatToXLM(baseAmount, baseCurrency);
    }
  } catch (error) {
    console.error('[exchange-rates] Error calculating equivalents:', error);
    // Return at least the base currency on error
  }

  return equivalents;
}

/**
 * Check if exchange rate services are healthy
 */
export async function checkHealth(): Promise<{
  fiat: { healthy: boolean; age: number };
  xlm: { healthy: boolean; age: number; rate: number | null };
}> {
  const now = Date.now();

  return {
    fiat: {
      healthy: fiatCache.rates !== null && now - fiatCache.timestamp < FIAT_CACHE_TTL * 2,
      age: fiatCache.rates ? now - fiatCache.timestamp : -1,
    },
    xlm: {
      healthy: xlmCache.rate !== null && now - xlmCache.timestamp < XLM_CACHE_TTL * 2,
      age: xlmCache.rate ? now - xlmCache.timestamp : -1,
      rate: xlmCache.rate,
    },
  };
}



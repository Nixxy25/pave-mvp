import { useQuery } from '@tanstack/react-query';

export interface ExchangeRates {
  fiat: {
    USD: number;
    NGN: number;
    GHS: number;
    KES: number;
  };
  xlm: number;
  timestamp: number;
}

/**
 * Fetch live exchange rates from the API
 */
async function fetchExchangeRates(): Promise<ExchangeRates> {
  const response = await fetch('/api/exchange-rates');
  
  if (!response.ok) {
    throw new Error('Failed to fetch exchange rates');
  }
  
  return response.json();
}

/**
 * React Query hook for fetching live exchange rates
 * Refetches every 30 seconds and on window focus
 */
export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates'],
    queryFn: fetchExchangeRates,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Convert an amount from one currency to another using live rates
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: ExchangeRates
): number {
  if (from === to) return amount;

  // XLM to fiat
  if (from === 'XLM') {
    const usdAmount = amount * rates.xlm;
    if (to === 'USD') return parseFloat(usdAmount.toFixed(2));
    
    const toRate = rates.fiat[to as keyof typeof rates.fiat];
    return parseFloat((usdAmount * toRate).toFixed(2));
  }

  // Fiat to XLM
  if (to === 'XLM') {
    const fromRate = rates.fiat[from as keyof typeof rates.fiat];
    const usdAmount = amount / fromRate;
    const xlmAmount = usdAmount / rates.xlm;
    return parseFloat(xlmAmount.toFixed(7)); // XLM has 7 decimal places
  }

  // Fiat to fiat
  const fromRate = rates.fiat[from as keyof typeof rates.fiat];
  const toRate = rates.fiat[to as keyof typeof rates.fiat];
  const usdAmount = amount / fromRate;
  return parseFloat((usdAmount * toRate).toFixed(2));
}

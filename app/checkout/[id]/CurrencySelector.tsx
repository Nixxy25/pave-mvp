'use client';

import { getCurrencyName, isSupportedCurrency } from '@/lib/constants';

interface CurrencySelectorProps {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  equivalents: Record<string, number>;
  acceptedCurrencies: string[];
}

export function CurrencySelector({
  selectedCurrency,
  setSelectedCurrency,
  equivalents,
  acceptedCurrencies,
}: CurrencySelectorProps) {
  return (
    <div className="mb-5 flex items-center gap-3 rounded-lg border bg-gray-50 px-4 py-3">
      <span className="text-[13px] text-muted-foreground">Pay in</span>
      <select
        value={selectedCurrency}
        onChange={(e) => setSelectedCurrency(e.target.value)}
        className="flex-1 cursor-pointer bg-transparent text-[14px] font-medium text-foreground outline-none"
      >
        {Object.keys(equivalents)
          .filter((curr) => isSupportedCurrency(curr) && acceptedCurrencies.includes(curr))
          .map((curr: string) => (
            <option key={curr} value={curr}>
              {curr} — {getCurrencyName(curr)}
            </option>
          ))}
      </select>
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { BalanceData, Payment } from '@/types';
import { useExchangeRates, convertCurrency } from '@/hooks/useExchangeRates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StatsCardsProps {
  balance: BalanceData;
  payments: Payment[];
  activities: Array<Payment>;
}

type ConversionCurrency = 'XLM' | 'NGN' | 'GHS' | 'KES';

export function StatsCards({ balance, payments, activities }: StatsCardsProps) {
  const { data: exchangeRates } = useExchangeRates();
  const [selectedCurrency, setSelectedCurrency] = useState<ConversionCurrency>('XLM');
  const today = new Date().toDateString();

  const todayPayments = payments.filter(
    (p) => p.status === 'completed' && new Date(p.createdAt).toDateString() === today,
  );

  const paymentsTotal = todayPayments.reduce((sum, p) => sum + (p.usdcAmount || 0), 0);
  const usdcChange = paymentsTotal;
  
  // Calculate equivalent in selected currency
  const equivalentValue = exchangeRates 
    ? convertCurrency(balance.usdc, 'USD', selectedCurrency, exchangeRates)
    : balance.usdc;
  
  const equivalentChange = exchangeRates
    ? convertCurrency(usdcChange, 'USD', selectedCurrency, exchangeRates)
    : usdcChange;
  
  // Currency symbols and formatting
  const currencySymbols: Record<ConversionCurrency, string> = {
    XLM: 'XLM',
    NGN: '₦',
    GHS: 'GH₵',
    KES: 'KES',
  };

  const todayActivityCount = activities.filter(
    (a) => new Date(a.createdAt).toDateString() === today,
  ).length;

  const symbol = currencySymbols[selectedCurrency];
  const displayValue = selectedCurrency === 'XLM' 
    ? `${symbol} ${equivalentValue.toFixed(2)}`
    : `${symbol}${equivalentValue.toLocaleString()}`;
  const displayChange = selectedCurrency === 'XLM'
    ? `${equivalentChange >= 0 ? '+' : ''}${symbol} ${Math.abs(equivalentChange).toFixed(2)}`
    : `${equivalentChange >= 0 ? '+' : ''}${symbol}${Math.abs(equivalentChange).toLocaleString()}`;

  const stats = [
    {
      label: 'Available Balance',
      value: `$${balance.usdc.toLocaleString()}`,
      sub: 'USDC · Stellar wallet',
      change: `${usdcChange >= 0 ? '+' : ''}$${Math.abs(usdcChange).toLocaleString()} today`,
      positive: usdcChange >= 0,
      isConversion: false,
    },
    {
      label: 'Conversion',
      value: displayValue,
      sub: 'Live  rate',
      change: displayChange,
      positive: equivalentChange >= 0,
      isConversion: true,
    },
    {
      label: 'Activity Today',
      value: todayActivityCount.toString(),
      sub: 'Payment transactions',
      change:
        todayActivityCount === 0
          ? 'Just started'
          : `${todayActivityCount} transaction${todayActivityCount !== 1 ? 's' : ''}`,
      positive: true,
      isConversion: false,
    },
    {
      label: 'Avg Settle Time',
      value: '5s',
      sub: 'Stellar block time',
      change: 'Live network avg',
      positive: true,
      isConversion: false,
    },
  ];

  return (
    <div
      className="mb-6.5 grid animate-fadeup grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
      style={{ animationDelay: '0.14s' }}
    >
      {stats.map((stat, i) => (
        <div
          key={i}
          className="border bg-card p-4.5 px-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] transition-shadow hover:shadow-[0_1px_3px_rgba(0,0,0,.08),0_1px_2px_rgba(0,0,0,.04)]"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.5px] text-muted-foreground">
              {stat.label}
            </div>
            {stat.isConversion && (
              <Select value={selectedCurrency} onValueChange={(val) => setSelectedCurrency(val as ConversionCurrency)}>
                <SelectTrigger className="h-6 w-[85px] border-muted text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XLM">XLM</SelectItem>
                  <SelectItem value="NGN">NGN</SelectItem>
                  <SelectItem value="GHS">GHS</SelectItem>
                  <SelectItem value="KES">KES</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="mb-1 font-serif text-[30px] font-light italic leading-none tracking-tighter text-foreground">
            {stat.value}
          </div>
          <div className="text-[12px] text-muted-foreground">{stat.sub}</div>
          <div
            className={`mt-2 inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[11.5px] ${
              stat.positive
                ? 'border-[var(--success-medium)] bg-[var(--success-light)] text-[var(--success)]'
                : 'border-red-200 bg-red-50 text-red-600'
            }`}
          >
            {stat.positive ? '↑' : '↓'} {stat.change}
          </div>
        </div>
      ))}
    </div>
  );
}

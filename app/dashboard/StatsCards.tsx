'use client';

import type { BalanceData, Payment } from '@/types';
import { useExchangeRates } from '@/hooks/useExchangeRates';

interface StatsCardsProps {
  balance: BalanceData;
  payments: Payment[];
  activities: Array<Payment>;
}

export function StatsCards({ balance, payments, activities }: StatsCardsProps) {
  const { data: exchangeRates } = useExchangeRates();
  const today = new Date().toDateString();

  const todayPayments = payments.filter(
    (p) => p.status === 'completed' && new Date(p.createdAt).toDateString() === today,
  );

  const paymentsTotal = todayPayments.reduce((sum, p) => sum + (p.usdcAmount || 0), 0);
  const usdcChange = paymentsTotal;
  
  const ngnRate = exchangeRates 
    ? exchangeRates.fiat.NGN 
    : (balance.usdc > 0 ? balance.ngn / balance.usdc : 1605);
  const ngnChange = usdcChange * ngnRate;

  const todayActivityCount = activities.filter(
    (a) => new Date(a.createdAt).toDateString() === today,
  ).length;

  const stats = [
    {
      label: 'Available Balance',
      value: `$${balance.usdc.toLocaleString()}`,
      sub: 'USDC · Stellar wallet',
      change: `${usdcChange >= 0 ? '+' : ''}$${Math.abs(usdcChange).toLocaleString()} today`,
      positive: usdcChange >= 0,
    },
    {
      label: 'NGN Equivalent',
      value: `₦${balance.ngn.toLocaleString()}`,
      sub: 'Live Stellar rate',
      change: `${ngnChange >= 0 ? '+' : ''}₦${Math.abs(ngnChange).toLocaleString()}`,
      positive: ngnChange >= 0,
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
    },
    {
      label: 'Avg Settle Time',
      value: '5s',
      sub: 'Stellar block time',
      change: 'Live network avg',
      positive: true,
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
          className="rounded-[14px] border bg-card p-4.5 px-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] transition-shadow hover:shadow-[0_1px_3px_rgba(0,0,0,.08),0_1px_2px_rgba(0,0,0,.04)]"
        >
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.5px] text-muted-foreground">
            {stat.label}
          </div>
          <div className="mb-1 font-serif text-[30px] font-light italic leading-none tracking-tighter text-foreground">
            {stat.value}
          </div>
          <div className="text-[12px] text-muted-foreground">{stat.sub}</div>
          <div
            className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11.5px] ${
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

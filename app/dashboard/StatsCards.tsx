'use client';

import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent } from 'motion/react';
import { Activity, ArrowLeftRight, ArrowDownRight, ArrowUpRight, Wallet, Zap } from 'lucide-react';
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

type ConversionCurrency = 'XLM' | 'GHS' | 'KES';

const CURRENCY_PREFIX: Record<ConversionCurrency, string> = {
  XLM: 'XLM ',
  GHS: 'GH₵',
  KES: 'KES ',
};

function format(v: number, decimals: number, prefix: string, suffix: string) {
  return `${prefix}${v.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;
}

function CountUp({
  to,
  decimals = 0,
  prefix = '',
  suffix = '',
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const mv = useMotionValue(0);
  const [text, setText] = useState(() => format(0, decimals, prefix, suffix));

  useMotionValueEvent(mv, 'change', (v) => setText(format(v, decimals, prefix, suffix)));

  useEffect(() => {
    const controls = animate(mv, to, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [mv, to]);

  return <>{text}</>;
}

export function StatsCards({ balance, payments, activities }: StatsCardsProps) {
  const { data: exchangeRates } = useExchangeRates();
  const [selectedCurrency, setSelectedCurrency] = useState<ConversionCurrency>('XLM');
  const today = new Date().toDateString();

  const todayPayments = payments.filter(
    (p) => p.status === 'completed' && new Date(p.createdAt).toDateString() === today,
  );

  const todayTotal = todayPayments.reduce((sum, p) => sum + (p.usdcAmount || 0), 0);

  const equivalentValue = exchangeRates
    ? convertCurrency(balance.usdc, 'USD', selectedCurrency, exchangeRates)
    : balance.usdc;
  const equivalentChange = exchangeRates
    ? convertCurrency(todayTotal, 'USD', selectedCurrency, exchangeRates)
    : todayTotal;

  const prefix = CURRENCY_PREFIX[selectedCurrency];
  const todayActivityCount = activities.filter(
    (a) => new Date(a.createdAt).toDateString() === today,
  ).length;

  const cards = [
    {
      label: 'Available balance',
      icon: Wallet,
      value: <CountUp to={balance.usdc} decimals={2} prefix="$" />,
      sub: 'USDC · Stellar wallet',
      change: `+$${todayTotal.toLocaleString()} today`,
      positive: true,
      hero: true,
      selector: false,
    },
    {
      label: 'Conversion',
      icon: ArrowLeftRight,
      value: <CountUp key={selectedCurrency} to={equivalentValue} decimals={2} prefix={prefix} />,
      sub: 'Live rate',
      change: `+${prefix}${equivalentChange.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      positive: true,
      hero: false,
      selector: true,
    },
    {
      label: 'Activity today',
      icon: Activity,
      value: <CountUp to={todayActivityCount} />,
      sub: 'Payment transactions',
      change:
        todayActivityCount === 0
          ? 'Just getting started'
          : `${todayActivityCount} transaction${todayActivityCount !== 1 ? 's' : ''}`,
      positive: true,
      hero: false,
      selector: false,
    },
    {
      label: 'Avg settle time',
      icon: Zap,
      value: <CountUp to={5} suffix="s" />,
      sub: 'Stellar block time',
      change: 'Live network avg',
      positive: true,
      hero: false,
      selector: false,
    },
  ];

  return (
    <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4 }}
            className={`group relative overflow-hidden rounded-3xl p-5 ${
              c.hero
                ? 'bg-[var(--pave-orange)] text-white shadow-[0_20px_50px_-20px_rgba(208,82,0,0.7)]'
                : 'border border-border/60 bg-card shadow-[0_1px_2px_rgba(0,0,0,.04),0_12px_32px_-16px_rgba(0,0,0,.12)]'
            }`}
          >

            <div className="relative mb-4 flex items-center justify-between">
              <span
                className={`grid size-10 place-items-center rounded-2xl ${
                  c.hero ? 'bg-white/20 text-white' : 'bg-[var(--pave-orange-light)] text-[var(--pave-orange)]'
                }`}
              >
                <Icon className="size-[18px]" />
              </span>
              {c.selector && (
                <Select
                  value={selectedCurrency}
                  onValueChange={(val) => setSelectedCurrency(val as ConversionCurrency)}
                >
                  <SelectTrigger className="h-7 w-[84px] rounded-full border-border/60 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XLM">XLM</SelectItem>
                    <SelectItem value="GHS">GHS</SelectItem>
                    <SelectItem value="KES">KES</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div
              className={`relative font-mono text-[10.5px] uppercase tracking-[0.08em] ${
                c.hero ? 'text-white/80' : 'text-muted-foreground'
              }`}
            >
              {c.label}
            </div>
            <div className="relative mt-1 font-serif text-[32px] font-light italic leading-none tracking-tight tabular-nums">
              {c.value}
            </div>
            <div className={`relative mt-1.5 text-[12px] ${c.hero ? 'text-white/80' : 'text-muted-foreground'}`}>
              {c.sub}
            </div>

            <div
              className={`relative mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[11px] ${
                c.hero
                  ? 'bg-white/20 text-white'
                  : c.positive
                    ? 'bg-[var(--success-light)] text-[var(--success)]'
                    : 'bg-red-50 text-red-600'
              }`}
            >
              {c.positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {c.change}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

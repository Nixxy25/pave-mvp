'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import type { Payment } from '@/types';

interface ActivityChartProps {
  payments: Payment[];
}

const DAYS = 7;

export function ActivityChart({ payments }: ActivityChartProps) {
  const { days, total, count, max } = useMemo(() => {
    const buckets = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (DAYS - 1 - i));
      return { date: d, label: d.toLocaleDateString('en-US', { weekday: 'short' }), amount: 0, count: 0 };
    });

    for (const p of payments) {
      if (p.status !== 'completed') continue;
      const created = new Date(p.createdAt);
      created.setHours(0, 0, 0, 0);
      const bucket = buckets.find((b) => b.date.getTime() === created.getTime());
      if (bucket) {
        bucket.amount += p.usdcAmount || 0;
        bucket.count += 1;
      }
    }

    return {
      days: buckets,
      total: buckets.reduce((s, b) => s + b.amount, 0),
      count: buckets.reduce((s, b) => s + b.count, 0),
      max: Math.max(...buckets.map((b) => b.amount), 0),
    };
  }, [payments]);

  const empty = max === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col rounded-3xl border border-border/60 bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,.04),0_12px_32px_-16px_rgba(0,0,0,.12)] lg:col-span-2"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-[19px] font-light italic text-foreground">Payments this week</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">Completed payments, last 7 days</p>
        </div>
        <div className="text-right">
          <div className="font-serif text-[26px] font-light italic leading-none tabular-nums text-foreground">
            ${total.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 font-mono text-[11px] text-muted-foreground">
            {count} payment{count !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="relative mt-6 flex h-44 items-end gap-2 sm:gap-3">
        {[0, 1, 2].map((l) => (
          <div
            key={l}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/70"
            style={{ bottom: `${(l + 1) * 25}%` }}
          />
        ))}

        {days.map((d, i) => {
          const pct = empty ? 6 : Math.max((d.amount / max) * 100, d.amount > 0 ? 8 : 4);
          const isToday = i === DAYS - 1;
          return (
            <div key={d.label + i} className="group relative flex h-full flex-1 flex-col justify-end">
              <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl bg-foreground px-2.5 py-1.5 font-mono text-[11px] text-background opacity-0 shadow-lg transition-all duration-200 group-hover:-translate-y-[calc(100%+4px)] group-hover:opacity-100">
                ${d.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} · {d.count}
              </div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ delay: 0.5 + i * 0.07, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className={`w-full rounded-xl transition-all duration-300 group-hover:brightness-110 ${
                  empty
                    ? 'bg-muted'
                    : isToday
                      ? 'bg-[var(--pave-orange)]'
                      : 'bg-[var(--pave-orange-medium)] group-hover:bg-[var(--pave-orange)]'
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2 sm:gap-3">
        {days.map((d, i) => (
          <div
            key={d.label + i}
            className={`flex-1 text-center font-mono text-[10.5px] uppercase tracking-wide ${
              i === DAYS - 1 ? 'font-medium text-[var(--pave-orange)]' : 'text-muted-foreground'
            }`}
          >
            {d.label}
          </div>
        ))}
      </div>

      {empty && (
        <p className="mt-4 text-center text-[12.5px] text-muted-foreground">
          No completed payments yet. They&apos;ll show up here as they come in.
        </p>
      )}
    </motion.div>
  );
}

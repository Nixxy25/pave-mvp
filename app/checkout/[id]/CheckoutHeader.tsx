'use client';

import { motion } from 'motion/react';
import { Check, Lock, ShieldCheck, Zap } from 'lucide-react';

export type CheckoutStep = 'details' | 'method' | 'pay';

const STEPS: { key: CheckoutStep; label: string; hint: string }[] = [
  { key: 'details', label: 'Your details', hint: 'Who is paying' },
  { key: 'method', label: 'Payment method', hint: 'Wallet or card' },
  { key: 'pay', label: 'Pay', hint: 'Confirm & send' },
];

interface OrderSummaryProps {
  merchantName?: string;
  currency: string;
  amount: number;
  description: string;
  step: CheckoutStep;
  equivalents: { code: string; value: number }[];
}

export function OrderSummary({
  merchantName,
  currency,
  amount,
  description,
  step,
  equivalents,
}: OrderSummaryProps) {
  const current = STEPS.findIndex((s) => s.key === step);
  const initial = (merchantName || 'P').trim().charAt(0).toUpperCase();

  return (
    <div className="relative flex flex-col overflow-hidden bg-[var(--pave-orange)] p-7 text-white sm:p-9">

      <div className="relative flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-white/20 font-serif text-[20px] italic backdrop-blur">
          {initial}
        </span>
        <div className="min-w-0">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/75">Paying</div>
          <div className="truncate text-[15px] font-medium">{merchantName || 'Merchant'}</div>
        </div>
      </div>

      <div className="relative mt-9">
        <div className="text-[13.5px] text-white/80">{description}</div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-1.5 font-serif text-[44px] font-light italic leading-none tracking-tight sm:text-[52px]"
        >
          <span className="mr-2 text-[22px] not-italic opacity-80 sm:text-[26px]">{currency}</span>
          {amount.toLocaleString()}
        </motion.div>

        {equivalents.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {equivalents.map((e) => (
              <span
                key={e.code}
                className="rounded-full bg-white/18 px-3 py-1 font-mono text-[11.5px] backdrop-blur"
              >
                ≈ {e.code} {e.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-[11px] text-white/80">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-white" />
              </span>
              live rate
            </span>
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="relative mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/18 px-3 py-1.5 font-mono text-[11px] backdrop-blur md:hidden">
        Step {current + 1} of {STEPS.length} · {STEPS[current].label}
      </div>

      <ol className="relative mt-12 hidden space-y-1 md:block">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.key} className="relative flex items-center gap-3.5 py-2">
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute left-[15px] top-[38px] h-[calc(100%-14px)] w-px transition-colors duration-500 ${
                    done ? 'bg-white' : 'bg-white/25'
                  }`}
                />
              )}
              <motion.span
                animate={{ scale: active ? 1.08 : 1 }}
                className={`relative grid size-8 shrink-0 place-items-center rounded-full border font-mono text-[12px] transition-colors duration-300 ${
                  done
                    ? 'border-white bg-white text-[var(--pave-orange)]'
                    : active
                      ? 'border-white bg-white/25 text-white'
                      : 'border-white/35 text-white/70'
                }`}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </motion.span>
              <div className={`transition-opacity ${active || done ? 'opacity-100' : 'opacity-70'}`}>
                <div className="text-[14px] font-medium leading-tight">{s.label}</div>
                <div className="text-[12px] text-white/75">{s.hint}</div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="relative mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-6 text-[11.5px] text-white/80 md:pt-9">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" /> Secured
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="size-3.5" /> Settles in ~5s
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Lock className="size-3.5" /> Stellar network
        </span>
      </div>
    </div>
  );
}

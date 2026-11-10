'use client';

import { motion } from 'motion/react';
import { ArrowRight, CreditCard, Landmark, Wallet, type LucideIcon } from 'lucide-react';

export type PaymentMethod = 'stellar' | 'transfer' | 'card';

interface Option {
  key: PaymentMethod;
  title: string;
  hint: string;
  badge: string;
  icon: LucideIcon;
}

interface PaymentMethodSelectorProps {
  hasStellarOption: boolean;
  hasPaystack: boolean;
  xlmAmount?: number;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({ hasStellarOption, hasPaystack, xlmAmount, onSelect }: PaymentMethodSelectorProps) {
  const options: (Option & { disabled: boolean })[] = [
    {
      key: 'stellar',
      title: 'Stablecoins & crypto',
      hint: hasStellarOption
        ? `Scan a QR or connect a wallet${xlmAmount ? ` · ${xlmAmount.toFixed(2)} XLM` : ''}`
        : 'Not available for this link',
      badge: 'Instant',
      icon: Wallet,
      disabled: !hasStellarOption,
    },
    {
      key: 'transfer',
      title: 'Bank transfer & mobile money',
      hint: hasPaystack ? 'Pay from your bank or mobile wallet' : 'Not available yet',
      badge: 'Local',
      icon: Landmark,
      disabled: !hasPaystack,
    },
    {
      key: 'card',
      title: 'Debit / credit card',
      hint: hasPaystack ? 'Visa, Mastercard, Verve' : 'Not available yet',
      badge: 'Secure',
      icon: CreditCard,
      disabled: !hasPaystack,
    },
  ];

  return (
    <div className="space-y-3">
      {options.map((o, i) => {
        const Icon = o.icon;
        return (
          <motion.button
            key={o.key}
            type="button"
            disabled={o.disabled}
            onClick={() => onSelect(o.key)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            whileHover={o.disabled ? undefined : { y: -3 }}
            whileTap={o.disabled ? undefined : { scale: 0.985 }}
            className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-border/70 bg-card p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,.04)] outline-none transition-colors hover:border-[var(--pave-orange)] focus-visible:ring-4 focus-visible:ring-[var(--pave-orange)]/15 disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-55 disabled:hover:border-border/70"
          >
            <span className="pointer-events-none absolute inset-0 bg-[var(--pave-orange-light)] opacity-0 transition-opacity duration-300 group-enabled:group-hover:opacity-100" />
            <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--pave-orange)] text-white shadow-[0_10px_24px_-10px_rgba(208,82,0,0.8)] transition-transform duration-300 group-enabled:group-hover:-rotate-6 group-enabled:group-hover:scale-105 group-disabled:bg-muted group-disabled:text-muted-foreground group-disabled:shadow-none">
              <Icon className="size-5" />
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2">
                <span className="text-[15px] font-semibold text-foreground">{o.title}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {o.badge}
                </span>
              </span>
              <span className="mt-0.5 block text-[12.5px] text-muted-foreground">{o.hint}</span>
            </span>
            <ArrowRight className="relative size-5 text-muted-foreground transition-all duration-300 group-enabled:group-hover:translate-x-1 group-enabled:group-hover:text-[var(--pave-orange)]" />
          </motion.button>
        );
      })}
    </div>
  );
}

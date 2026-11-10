'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Code, Link2, TrendingUp, Wallet } from 'lucide-react';

const actions = [
  { href: '/checkout-links', label: 'Create checkout link', hint: 'Get paid with a shareable link', icon: Link2 },
  { href: '/withdrawals', label: 'Withdraw funds', hint: 'Move your balance out', icon: Wallet },
  { href: '/settlement', label: 'View settlement', hint: 'See how you get paid', icon: TrendingUp },
  { href: '/api-webhooks', label: 'API & webhooks', hint: 'Build Pave into your app', icon: Code },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.42, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl border border-border/60 bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,.04),0_12px_32px_-16px_rgba(0,0,0,.12)]"
    >
      <h2 className="font-serif text-[19px] font-light italic text-foreground">Quick actions</h2>
      <p className="mt-0.5 text-[12.5px] text-muted-foreground">Jump to what you need</p>

      <div className="mt-4 flex flex-col gap-1.5">
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.div
              key={a.href}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.07, duration: 0.45 }}
            >
              <Link
                href={a.href}
                className="group flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-muted"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--pave-orange-light)] text-[var(--pave-orange)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <Icon className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-foreground">{a.label}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">{a.hint}</span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

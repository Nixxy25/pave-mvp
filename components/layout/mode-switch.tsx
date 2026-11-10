'use client';

import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Sandbox / Live switch.
 * Only Sandbox is wired up today (Stellar testnet + Paystack test mode), so Live is shown
 * but locked rather than pretending to switch networks.
 */
export function ModeSwitch() {
  return (
    <div
      role="radiogroup"
      aria-label="Environment"
      className="hidden items-center rounded-full border border-border/70 bg-muted/60 p-0.5 font-mono text-[12px] font-medium sm:flex"
    >
      <button
        type="button"
        role="radio"
        aria-checked
        className="relative flex cursor-default items-center gap-1.5 rounded-full px-3 py-1 text-foreground"
      >
        <motion.span
          layoutId="env-pill"
          className="absolute inset-0 rounded-full bg-card shadow-sm ring-1 ring-border/60"
        />
        <span className="relative flex items-center gap-1.5">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-amber-500" />
          </span>
          Sandbox
        </span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={false}
        title="Live mode isn't available yet"
        onClick={() => toast('Live mode is coming soon', { description: 'You’re in Sandbox: test payments only, no real money moves.' })}
        className="relative flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Lock className="size-3" />
        Live
      </button>
    </div>
  );
}

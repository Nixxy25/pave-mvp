'use client';

import { Badge } from '@/components/ui/badge';

type PaymentMethod = 'card' | 'stellar';

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  hasStellarOption: boolean;
}

export function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
  hasStellarOption,
}: PaymentMethodSelectorProps) {
  return (
    <div className="mb-5 space-y-2.5">
      {/* Card option */}
      <button
        onClick={() => setPaymentMethod('card')}
        className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition-all ${
          paymentMethod === 'card'
            ? 'border-[var(--pave-orange)] bg-[var(--pave-orange-light)]'
            : 'border-border bg-card hover:border-[var(--pave-orange)]/40'
        }`}
      >
        <div
          className={`h-5 w-5 flex-shrink-0 rounded-full border-2 ${
            paymentMethod === 'card'
              ? 'border-[var(--pave-orange)] bg-card'
              : 'border-muted-foreground/40 bg-card'
          }`}
        >
          {paymentMethod === 'card' && (
            <div className="h-full w-full scale-[.55] rounded-full bg-[var(--pave-orange)]" />
          )}
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-medium text-foreground">Debit / Credit Card</div>
          <div className="text-[12px] text-muted-foreground">Visa, Mastercard, Verve</div>
        </div>
        <Badge className="bg-muted text-foreground">Any</Badge>
      </button>

      {/* Stellar option — only shown if merchant has a stellar wallet address */}
      {hasStellarOption && (
        <button
          onClick={() => setPaymentMethod('stellar')}
          className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition-all ${
            paymentMethod === 'stellar'
              ? 'border-[var(--stellar)] bg-[var(--stellar)]/5'
              : 'border-border bg-card hover:border-[var(--stellar)]/40'
          }`}
        >
          <div
            className={`h-5 w-5 flex-shrink-0 rounded-full border-2 ${
              paymentMethod === 'stellar'
                ? 'border-[var(--stellar)] bg-card'
                : 'border-muted-foreground/40 bg-card'
            }`}
          >
            {paymentMethod === 'stellar' && (
              <div className="h-full w-full scale-[.55] rounded-full bg-[var(--stellar)]" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-medium text-foreground">Stellar Wallet</div>
            <div className="text-[12px] text-muted-foreground">Pay with XLM on Stellar testnet</div>
          </div>
          <Badge
            className="border-[var(--stellar)]/30 bg-[var(--stellar)]/10 text-[var(--stellar)]"
            variant="outline"
          >
            XLM
          </Badge>
        </button>
      )}
    </div>
  );
}

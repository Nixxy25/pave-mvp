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
        className={`flex w-full items-center gap-3 border-2 p-4 text-left transition-all ${
          paymentMethod === 'card'
            ? 'border-[var(--pave-orange)] bg-[var(--pave-orange-light)]'
            : 'border-border bg-card hover:border-[var(--pave-orange)]/40'
        }`}
      >
        <div
          className={`h-5 w-5 flex-shrink-0 border-2 ${
            paymentMethod === 'card'
              ? 'border-[var(--pave-orange)] bg-card'
              : 'border-muted-foreground/40 bg-card'
          }`}
        >
          {paymentMethod === 'card' && (
            <div className="h-full w-full scale-[.55] bg-[var(--pave-orange)]" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="text-[14px] font-medium text-foreground">Debit / Credit Card</div>
            <div className="flex items-center gap-1 bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                <path d="M1 5.5V3.5a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <rect x=".5" y="5" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              Coming soon
            </div>
          </div>
          <div className="text-[12px] text-muted-foreground">Visa, Mastercard, Verve</div>
        </div>
        <Badge className="bg-muted text-foreground">Any</Badge>
      </button>

      {/* Stellar option — only shown if merchant has a stellar wallet address */}
      {hasStellarOption && (
        <button
          onClick={() => setPaymentMethod('stellar')}
          className={`flex w-full items-center gap-3 border-2 p-4 text-left transition-all ${
            paymentMethod === 'stellar'
              ? 'border-[var(--stellar)] bg-[var(--stellar)]/5'
              : 'border-border bg-card hover:border-[var(--stellar)]/40'
          }`}
        >
          <div
            className={`h-5 w-5 flex-shrink-0 border-2 ${
              paymentMethod === 'stellar'
                ? 'border-[var(--stellar)] bg-card'
                : 'border-muted-foreground/40 bg-card'
            }`}
          >
            {paymentMethod === 'stellar' && (
              <div className="h-full w-full scale-[.55] bg-[var(--stellar)]" />
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

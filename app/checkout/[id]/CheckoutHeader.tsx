'use client';

import { Badge } from '@/components/ui/badge';

interface CheckoutHeaderProps {
  merchantInfo: { name: string; personName: string } | null;
  currency: string;
  amount: number;
  description: string;
  paymentMethod: 'card' | 'stellar';
  selectedCurrency: string;
  exchangeAmount: number;
  xlmAmount: number;
}

export function CheckoutHeader({
  merchantInfo,
  currency,
  amount,
  description,
  paymentMethod,
  selectedCurrency,
  exchangeAmount,
  xlmAmount,
}: CheckoutHeaderProps) {
  return (
    <div className="border-b p-6 pb-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--pave-orange)] to-[#ff8a00] font-serif text-xl font-medium text-white">
          {merchantInfo?.name?.[0] || 'B'}
        </div>
        <div>
          <div className="text-[15px] font-medium text-foreground">
            {merchantInfo?.name || 'Business'}
          </div>
          <div className="text-[12.5px] text-muted-foreground">
            {merchantInfo?.personName || 'Verified merchant'}
          </div>
        </div>
      </div>

      <div className="text-[13px] font-medium text-muted-foreground">{description}</div>
      <div className="mt-1.5 font-serif text-[36px] font-light italic leading-none text-foreground">
        {currency} {amount.toLocaleString()}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[13px]">
        <span className="text-muted-foreground">
          ≈{' '}
          {paymentMethod === 'stellar'
            ? `${xlmAmount.toFixed(2)} XLM`
            : `${selectedCurrency} ${exchangeAmount.toLocaleString()}`}
        </span>
        <Badge
          variant="outline"
          className="border-[var(--success-medium)] bg-[var(--success-light)] text-[10px] text-[var(--success)]"
        >
          <div className="mr-1 h-1 w-1 animate-blink rounded-full bg-[var(--success)]" />
          live rate
        </Badge>
      </div>
    </div>
  );
}

import { Coins, Lock } from 'lucide-react';
import { paymentMethodsForCurrency } from '@/features/payments/checkout-methods';

export function PaymentMethodNotice({ currency }: { currency: string }) {
  const crypto = paymentMethodsForCurrency(currency).includes('crypto');
  return (
    <div className="border bg-card p-3">
      <p className="text-xs text-text-muted">Payment methods</p>
      <p className="mt-1 text-sm font-medium text-text-primary">Crypto transfer and local bank transfer</p>
      <p className="mt-1 text-xs text-text-secondary">
        This checkout supports both. Customers can pay with USDC today; local bank transfer is coming soon.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 border border-[var(--pave-orange)] px-2 py-1 font-medium text-text-primary">
          <Coins aria-hidden="true" className="size-3.5" /> Crypto transfer · {crypto ? 'Available' : 'Unavailable'}
        </span>
        <span className="inline-flex items-center gap-1.5 border px-2 py-1 text-text-muted">
          <Lock aria-hidden="true" className="size-3.5" /> Local bank transfer · Coming soon
        </span>
      </div>
    </div>
  );
}

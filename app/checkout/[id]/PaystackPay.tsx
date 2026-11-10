'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Landmark, Loader2, Lock, Smartphone, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { convertCurrency, type ExchangeRates } from '@/hooks/useExchangeRates';

interface PaystackPayProps {
  mode: 'transfer' | 'card';
  checkoutLinkId: string;
  customerName: string;
  customerEmail: string;
  baseCurrency: string;
  baseAmount: number;
  acceptedCurrencies: string[];
  rates?: ExchangeRates;
}

const SYMBOL: Record<string, string> = { USD: '$', GHS: 'GH₵', KES: 'KES ' };
const NAMES: Record<string, string> = { USD: 'US Dollar', GHS: 'Ghana Cedi', KES: 'Kenyan Shilling' };

/** Pick the currency a customer most likely pays in, based on their timezone. */
function guessCurrency(options: string[]) {
  let tz = '';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {}
  const guess = tz === 'Africa/Accra' ? 'GHS' : tz === 'Africa/Nairobi' ? 'KES' : 'USD';
  return options.includes(guess) ? guess : options[0];
}

export function PaystackPay({
  mode,
  checkoutLinkId,
  customerName,
  customerEmail,
  baseCurrency,
  baseAmount,
  acceptedCurrencies,
  rates,
}: PaystackPayProps) {
  const options = useMemo(
    () => Array.from(new Set([baseCurrency, ...acceptedCurrencies])).filter((c) => SYMBOL[c]),
    [baseCurrency, acceptedCurrencies],
  );
  const [currency, setCurrency] = useState(() => guessCurrency(options));
  const [loading, setLoading] = useState(false);

  const amount = rates ? convertCurrency(baseAmount, baseCurrency, currency, rates) : baseAmount;
  const isCard = mode === 'card';

  const start = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutLinkId, customerName, customerEmail, currency, method: mode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.url) throw new Error(json.error || 'Could not start payment');
      window.location.href = json.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start payment');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {options.length > 1 && (
        <div>
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
            Pay in
          </div>
          <div className="flex flex-wrap gap-2">
            {options.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                aria-pressed={currency === c}
                className={`cursor-pointer rounded-full border px-4 py-2 font-mono text-[13px] font-medium outline-none transition-all active:scale-95 focus-visible:ring-4 focus-visible:ring-[var(--pave-orange)]/15 ${
                  currency === c
                    ? 'border-[var(--pave-orange)] bg-[var(--pave-orange-light)] text-[var(--pave-orange)]'
                    : 'border-border/70 bg-muted/40 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Amount card */}
      <motion.div
        key={currency}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-3xl bg-foreground p-6 text-background"
      >
        <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] opacity-60">
          {isCard ? 'Amount to charge' : 'Amount to transfer'}
        </div>
        <div className="mt-2 font-serif text-[40px] font-light italic leading-none tracking-tight">
          {SYMBOL[currency]}
          {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="mt-4 space-y-2 border-t border-background/15 pt-4 text-[13px]">
          <div className="flex justify-between">
            <span className="opacity-60">Currency</span>
            <span className="font-medium">{NAMES[currency] || currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">{isCard ? 'Method' : 'Methods'}</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              {isCard ? (
                <>
                  <CreditCard className="size-3.5" /> Visa · Mastercard · Verve
                </>
              ) : (
                <>
                  <Landmark className="size-3.5" /> Bank <Smartphone className="ml-1 size-3.5" /> Mobile money
                </>
              )}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4 text-[12.5px] leading-relaxed text-muted-foreground">
        <Clock className="mt-0.5 size-4 shrink-0" />
        <p>
          {isCard
            ? 'You’ll finish on Paystack’s secure page. Your card details never touch Pave.'
            : 'You’ll get the account or mobile-money prompt on Paystack’s secure page. Keep it open until the payment is confirmed; this page updates automatically.'}
        </p>
      </div>

      <Button
        onClick={start}
        disabled={loading || !rates}
        className="group h-13 w-full rounded-full bg-foreground py-4 text-[15px] font-medium text-background shadow-lg transition-all hover:bg-[var(--pave-orange)] hover:text-white hover:shadow-[0_10px_30px_-8px_rgba(208,82,0,0.6)] disabled:opacity-70"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Redirecting…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Lock className="size-4" />
            {isCard ? 'Pay with card' : 'Continue to transfer'}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        )}
      </Button>
    </div>
  );
}

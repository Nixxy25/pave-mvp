'use client';

import { useEffect, useMemo, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Clock, Copy, CreditCard, FlaskConical, Info, Landmark, Loader2, Smartphone } from 'lucide-react';

interface Tx {
  reference: string;
  amount: number;
  currency: string;
  channels: string[];
  status: string;
  email: string;
}

const SYMBOL: Record<string, string> = { USD: '$', GHS: 'GH₵', KES: 'KES ' };
const LABEL: Record<string, { label: string; icon: typeof CreditCard }> = {
  card: { label: 'Card', icon: CreditCard },
  bank_transfer: { label: 'Transfer', icon: Landmark },
  bank: { label: 'Transfer', icon: Landmark },
  mobile_money: { label: 'Mobile money', icon: Smartphone },
  ussd: { label: 'Mobile money', icon: Smartphone },
};

export default function MockPaystackPage() {
  const { reference } = useParams<{ reference: string }>();
  const [tx, setTx] = useState<Tx | null>(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState('card');
  const [phase, setPhase] = useState<'idle' | 'working' | 'done'>('idle');
  const [left, setLeft] = useState(30 * 60);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/mock-paystack?reference=${encodeURIComponent(reference)}`)
      .then(async (r) => {
        if (!r.ok) return setMissing(true);
        const j = (await r.json()) as Tx;
        setTx(j);
        setTab(j.channels.includes('card') ? 'card' : j.channels.includes('bank_transfer') ? 'bank_transfer' : j.channels[0]);
      })
      .catch(() => setMissing(true));
  }, [reference]);

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // stable fake account number per reference
  const account = useMemo(() => {
    let h = 7;
    for (const c of reference) h = (h * 31 + c.charCodeAt(0)) % 1_000_000_000;
    return String(1_000_000_000 + h).slice(0, 10);
  }, [reference]);

  if (missing) notFound();
  if (!tx) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;

  const tabs = Array.from(new Set(tx.channels.map((c) => LABEL[c]?.label))).map(
    (label) => tx.channels.find((c) => LABEL[c]?.label === label)!,
  );
  const amount = `${SYMBOL[tx.currency] || tx.currency + ' '}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  const finish = async (action: 'pay' | 'fail') => {
    setPhase('working');
    await new Promise((r) => setTimeout(r, action === 'pay' ? 1800 : 600));
    const res = await fetch('/api/mock-paystack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, action, channel: tab }),
    });
    const j = await res.json();
    setPhase('done');
    setTimeout(() => (window.location.href = j.redirect), 600);
  };

  const btn =
    'group inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-foreground text-[15px] font-medium text-background shadow-lg transition-all hover:bg-[var(--pave-orange)] hover:text-white disabled:opacity-70';

  return (
    <div className="min-h-screen bg-[#fafaf7] px-4 py-8 dark:bg-background">
      <div className="mx-auto max-w-[460px]">
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <FlaskConical className="size-4 shrink-0" />
          Mock Paystack · test mode. No real money moves.
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_40px_80px_-30px_rgba(0,0,0,.25)]">
          <div className="border-b border-border/60 p-6">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">Total</div>
            <div className="mt-1 font-serif text-[38px] font-light italic leading-none text-foreground">{amount}</div>
            <div className="mt-2 truncate text-[12.5px] text-muted-foreground">{tx.email}</div>
          </div>

          <div className="p-6">
            {tabs.length > 1 && (
              <div className="mb-5 flex rounded-full bg-muted p-1">
                {tabs.map((c) => {
                  const Icon = LABEL[c].icon;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => phase === 'idle' && setTab(c)}
                      className={`relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium ${
                        tab === c ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {tab === c && (
                        <motion.span layoutId="mp-tab" className="absolute inset-0 rounded-full bg-card shadow-sm" />
                      )}
                      <span className="relative flex items-center gap-1.5">
                        <Icon className="size-3.5" />
                        {LABEL[c].label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {tab === 'card' && (
                  <div className="space-y-3">
                    {[
                      ['Card number', '4084 0840 8408 4081'],
                      ['Expiry', '12 / 30'],
                      ['CVV', '408'],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">{l}</div>
                        <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 font-mono text-[14px] text-foreground">{v}</div>
                      </div>
                    ))}
                    <p className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                      <Info className="size-3.5" /> Prefilled test card.
                    </p>
                  </div>
                )}

                {(tab === 'bank_transfer' || tab === 'bank') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        <Clock className="size-4" /> Expires in
                      </span>
                      <span className="font-mono text-[18px] font-semibold tabular-nums">{mm}:{ss}</span>
                    </div>
                    <div className="rounded-3xl bg-foreground p-6 text-background">
                      <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] opacity-60">Amount to transfer</div>
                      <div className="mt-2 text-[34px] font-semibold leading-none tracking-tight">{amount}</div>
                      <div className="mt-5 space-y-2.5 border-t border-background/15 pt-4 text-[14px]">
                        <div className="flex justify-between"><span className="opacity-60">Bank</span><span className="font-semibold">Mock Bank</span></div>
                        <div className="flex items-center justify-between">
                          <span className="opacity-60">Account</span>
                          <span className="inline-flex items-center gap-2 font-semibold">
                            {account}
                            <button
                              type="button"
                              onClick={() => { navigator.clipboard?.writeText(account); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                              className="cursor-pointer opacity-70 hover:opacity-100"
                            >
                              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                            </button>
                          </span>
                        </div>
                        <div className="flex justify-between"><span className="opacity-60">Name</span><span className="font-semibold">Pave / Test Merchant</span></div>
                      </div>
                    </div>
                    <p className="flex items-start gap-2 rounded-2xl border border-border/70 p-3.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      <Info className="mt-0.5 size-4 shrink-0" />
                      Pay from an account in your own name. Funds are credited automatically once confirmed.
                    </p>
                  </div>
                )}

                {(tab === 'mobile_money' || tab === 'ussd') && (
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">Provider</div>
                      <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-[14px]">
                        {tx.currency === 'KES' ? 'M-Pesa' : 'MTN Mobile Money'}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">Phone number</div>
                      <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 font-mono text-[14px]">
                        {tx.currency === 'KES' ? '0712 345 678' : '024 123 4567'}
                      </div>
                    </div>
                    <p className="text-[12.5px] text-muted-foreground">You&apos;ll approve the prompt on your phone.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <button type="button" disabled={phase !== 'idle'} onClick={() => finish('pay')} className={`${btn} mt-6`}>
              {phase === 'working' ? (
                <><Loader2 className="size-4 animate-spin" /> Confirming…</>
              ) : phase === 'done' ? (
                <><Check className="size-4" /> Payment confirmed</>
              ) : tab === 'card' ? (
                `Pay ${amount}`
              ) : tab === 'bank_transfer' || tab === 'bank' ? (
                'I have made the transfer'
              ) : (
                'I have approved the prompt'
              )}
            </button>
            {phase === 'idle' && (
              <button
                type="button"
                onClick={() => finish('fail')}
                className="mt-3 w-full cursor-pointer text-center text-[12.5px] text-muted-foreground hover:text-foreground"
              >
                Simulate a failed payment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

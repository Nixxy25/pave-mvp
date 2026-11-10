'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { Check, Clock, Copy, Loader2, QrCode, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { StellarPayment } from './StellarPayment';
import { API_ENDPOINTS } from '@/lib/constants';

interface CryptoPayProps {
  merchantAddress: string;
  xlmAmount: number;
  disabled?: boolean;
  onSuccess: (txHash: string) => void;
  onError: (msg: string) => void;
}

const NETWORKS: { name: string; live: boolean; dot: string }[] = [
  { name: 'Stellar', live: true, dot: 'bg-[var(--stellar)]' },
  { name: 'Base', live: false, dot: 'bg-blue-600' },
  { name: 'Polygon', live: false, dot: 'bg-purple-500' },
  { name: 'Arbitrum', live: false, dot: 'bg-sky-500' },
  { name: 'Optimism', live: false, dot: 'bg-red-500' },
  { name: 'Avalanche', live: false, dot: 'bg-rose-500' },
];

const WINDOW_SECONDS = 30 * 60;

function newMemo() {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return 'PAVE' + Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 8).toUpperCase();
}

export function CryptoPay({ merchantAddress, xlmAmount, disabled, onSuccess, onError }: CryptoPayProps) {
  const [tab, setTab] = useState<'qr' | 'wallet'>('qr');
  const [copied, setCopied] = useState<string | null>(null);
  const [left, setLeft] = useState(WINDOW_SECONDS);
  const [memo] = useState(() => newMemo());
  const done = useRef(false);

  const amountStr = xlmAmount.toFixed(7);
  // SEP-7 payment request: Stellar wallets that scan this pre-fill address, amount and memo.
  const uri = `web+stellar:pay?destination=${merchantAddress}&amount=${amountStr}&memo=${memo}&memo_type=MEMO_TEXT`;

  // countdown
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // Watch the ledger for a payment carrying our memo. The server still re-verifies everything.
  useEffect(() => {
    if (tab !== 'qr' || left === 0) return;
    let cancelled = false;
    const poll = async () => {
      if (done.current) return;
      try {
        const res = await fetch(
          `${API_ENDPOINTS.STELLAR_HORIZON_TESTNET}/accounts/${merchantAddress}/transactions?order=desc&limit=15`,
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          _embedded?: { records: { hash: string; memo?: string; successful: boolean }[] };
        };
        const hit = json._embedded?.records.find((r) => r.successful && r.memo === memo);
        if (hit && !cancelled && !done.current) {
          done.current = true;
          onSuccess(hit.hash);
        }
      } catch {
        /* network blip: try again on next tick */
      }
    };
    poll();
    const t = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [tab, merchantAddress, memo, left === 0, onSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error('Could not copy');
    }
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const short = `${merchantAddress.slice(0, 8)}…${merchantAddress.slice(-8)}`;

  return (
    <div className="space-y-4">
      {/* tabs */}
      <div className="flex rounded-full bg-muted p-1">
        {[
          { key: 'qr' as const, label: 'Scan or copy', icon: QrCode },
          { key: 'wallet' as const, label: 'Connect wallet', icon: Wallet },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium transition-colors ${
              tab === t.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === t.key && (
              <motion.span
                layoutId="crypto-tab"
                className="absolute inset-0 rounded-full bg-card shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <t.icon className="size-3.5" />
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {tab === 'wallet' ? (
        <StellarPayment
          merchantAddress={merchantAddress}
          xlmAmount={xlmAmount}
          onSuccess={onSuccess}
          onError={onError}
          disabled={disabled}
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* timer */}
          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <Clock className="size-4" /> Expires in
            </span>
            <span className="font-mono text-[18px] font-semibold tabular-nums text-foreground">
              {mm}:{ss}
            </span>
          </div>

          {left === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              This payment window has expired. Go back and start again.
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-[var(--success)]/30 bg-[var(--success-light)] px-4 py-3 text-center">
                <div className="text-[14px] font-semibold text-[var(--success)]">Send exactly {xlmAmount.toFixed(2)} XLM on Stellar</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">
                  Include the memo below. We detect your payment automatically.
                </div>
              </div>

              <div className="rounded-3xl border border-border/70 bg-card p-5">
                <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-sm">
                  <QRCodeSVG value={uri} size={176} level="M" />
                </div>

                <div className="mt-4 space-y-2 text-[13px]">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Address</div>
                      <div className="truncate font-mono text-[12.5px] text-foreground">{short}</div>
                    </div>
                    <CopyBtn on={copied === 'addr'} onClick={() => copy('addr', merchantAddress)} />
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3.5 py-2.5">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Memo (required)</div>
                      <div className="font-mono text-[12.5px] text-foreground">{memo}</div>
                    </div>
                    <CopyBtn on={copied === 'memo'} onClick={() => copy('memo', memo)} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[12.5px] text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Waiting for your payment…
              </div>
            </>
          )}

          <div>
            <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
              Networks
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {NETWORKS.map((n) => (
                <div
                  key={n.name}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[12.5px] ${
                    n.live
                      ? 'border-[var(--pave-orange)] bg-[var(--pave-orange-light)] font-medium text-foreground'
                      : 'border-border/60 text-muted-foreground opacity-70'
                  }`}
                >
                  <span className={`size-2.5 rounded-full ${n.dot}`} />
                  {n.name}
                  {!n.live && <span className="ml-auto font-mono text-[9.5px] uppercase">Soon</span>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function CopyBtn({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-[var(--pave-orange)] hover:text-[var(--pave-orange)]"
    >
      {on ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {on ? 'Copied' : 'Copy'}
    </button>
  );
}

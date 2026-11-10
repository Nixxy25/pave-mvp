'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Inbox } from 'lucide-react';
import { formatTimeAgo } from '@/lib/api/helpers';
import { useExchangeRates, convertCurrency } from '@/hooks';
import { ShortAddress } from '@/components/ShortAddress';
import { API_ENDPOINTS } from '@/lib/constants';
import type { Payment } from '@/types';

type Filter = 'all' | 'completed' | 'pending' | 'failed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
];

const HEADERS = ['Customer', 'Amount', 'USDC', 'TX ID', 'Time', 'Status', 'Receipt'];

function matches(status: string, filter: Filter) {
  if (filter === 'all') return true;
  if (filter === 'completed') return status === 'completed' || status === 'settled';
  if (filter === 'pending') return status === 'pending' || status === 'processing';
  return status === 'failed';
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
}

const STATUS_STYLES: Record<string, { pill: string; dot: string; pulse?: boolean }> = {
  completed: { pill: 'bg-[var(--success-light)] text-[var(--success)]', dot: 'bg-[var(--success)]' },
  settled: { pill: 'bg-[var(--success-light)] text-[var(--success)]', dot: 'bg-[var(--success)]' },
  processing: { pill: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300', dot: 'bg-orange-500', pulse: true },
  pending: { pill: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300', dot: 'bg-yellow-500', pulse: true },
  failed: { pill: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300', dot: 'bg-red-500' },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { pill: 'bg-muted text-muted-foreground', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${s.pill}`}>
      <span className="relative flex size-1.5">
        {s.pulse && <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-70 ${s.dot}`} />}
        <span className={`relative inline-flex size-1.5 rounded-full ${s.dot}`} />
      </span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

interface RecentActivityTableProps {
  activities: Array<Payment & { type: 'payment' }>;
}

export function RecentActivityTable({ activities }: RecentActivityTableProps) {
  const { data: exchangeRates } = useExchangeRates();
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f.key, activities.filter((a) => matches(a.status, f.key)).length]),
      ) as Record<Filter, number>,
    [activities],
  );
  const rows = useMemo(() => activities.filter((a) => matches(a.status, filter)), [activities, filter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(0,0,0,.04),0_12px_32px_-16px_rgba(0,0,0,.12)]"
    >
      <div className="flex flex-col gap-4 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-[19px] font-light italic text-foreground">Recent activity</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">Live feed, updates on each ledger close</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-full bg-muted p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`relative cursor-pointer rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                  filter === f.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {filter === f.key && (
                  <motion.span
                    layoutId="activity-filter"
                    className="absolute inset-0 rounded-full bg-card shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">
                  {f.label}
                  <span className="ml-1 font-mono text-[10px] opacity-60">{counts[f.key]}</span>
                </span>
              </button>
            ))}
          </div>
          <Link
            href="/payments"
            className="group hidden items-center gap-1 rounded-full border border-border/60 px-3.5 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-all hover:border-[var(--pave-orange)] hover:text-[var(--pave-orange)] sm:inline-flex"
          >
            View all
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="mb-3 grid size-14 place-items-center rounded-2xl bg-[var(--pave-orange-light)] text-[var(--pave-orange)]">
              <Inbox className="size-6" />
            </span>
            {activities.length === 0 ? (
              <p className="text-[13.5px] text-muted-foreground">
                No activity yet.{' '}
                <Link href="/checkout-links" className="font-medium text-[var(--pave-orange)] hover:underline">
                  Create your first checkout link
                </Link>{' '}
                to get started.
              </p>
            ) : (
              <p className="text-[13.5px] text-muted-foreground">No {filter} payments right now.</p>
            )}
          </div>
        ) : (
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-y border-border/60 bg-muted/40">
                {HEADERS.map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 font-mono text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground ${
                      i >= HEADERS.length - 2 ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody key={filter}>
              <AnimatePresence initial>
                {rows.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="group border-b border-border/50 transition-colors last:border-0 hover:bg-[var(--pave-orange-light)]/40"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--pave-orange)] font-mono text-[11px] font-medium text-white transition-transform duration-300 group-hover:scale-110">
                          {getInitials(p.payer.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[13.5px] font-medium text-foreground">{p.payer.name}</div>
                          <div className="max-w-[180px] truncate font-mono text-[11.5px] text-muted-foreground">
                            {p.description || p.source}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="whitespace-nowrap text-[13.5px] font-medium text-foreground">
                        {p.method === 'Stellar Wallet' && exchangeRates && p.usdcAmount
                          ? `XLM ${convertCurrency(p.usdcAmount, 'USD', 'XLM', exchangeRates).toFixed(2)}`
                          : `${p.currency} ${p.amount.toLocaleString()}`}
                      </div>
                      <div className="whitespace-nowrap font-mono text-[11.5px] text-muted-foreground">{p.method}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="whitespace-nowrap font-mono text-[13.5px] font-medium tabular-nums text-[var(--success)]">
                        {(p.usdcAmount ?? 0).toLocaleString()} USDC
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-3.5">
                      {p.method === 'Stellar Wallet' && p.stellarTxHash ? (
                        <a
                          href={`${API_ENDPOINTS.STELLAR_EXPLORER_TESTNET}/tx/${p.stellarTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          <ShortAddress
                            address={p.stellarTxHash}
                            startChars={6}
                            endChars={4}
                            className="text-[11.5px] text-[var(--stellar)]"
                          />
                        </a>
                      ) : (
                        <ShortAddress address={p.id} startChars={6} endChars={4} className="text-[11.5px] text-muted-foreground" />
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="whitespace-nowrap font-mono text-[12px] text-muted-foreground">
                        {formatTimeAgo(p.createdAt)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <StatusPill status={p.status} />
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {p.status === 'completed' ? (
                        <a
                          href={`/confirmed/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[12.5px] font-medium text-[var(--pave-orange)] hover:underline"
                        >
                          View
                          <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </a>
                      ) : (
                        <span className="text-[12.5px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance, usePayments } from '@/hooks';
import { getUserProfile, getStats } from '@/lib/api';
import { StatsCards } from './StatsCards';
import { ActivityChart } from './ActivityChart';
import { QuickActions } from './QuickActions';
import { RecentActivityTable } from './RecentActivityTable';
import type { Merchant, Payment } from '@/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-3xl bg-muted ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-7 sm:py-8">
      <Skeleton className="mb-8 h-16 w-72" />
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[178px]" />
        ))}
      </div>
      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[320px] lg:col-span-2" />
        <Skeleton className="h-[320px]" />
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<Merchant | null>(null);
  const { balance, loading: balanceLoading } = useBalance();
  const { payments, loading: paymentsLoading } = usePayments();

  useEffect(() => {
    if (!isAuthenticated) return;
    getUserProfile().then(setUser).catch(() => {});
    getStats().catch(() => {});
  }, [isAuthenticated]);

  // Derive activities directly from payments
  const activities = payments
    .map((p: Payment) => ({ ...p, type: 'payment' as const }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  if (balanceLoading || paymentsLoading) return <DashboardSkeleton />;

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-7 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="mb-1.5 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
            <span className="size-1.5 rounded-full bg-[var(--pave-orange)]" />
            Dashboard
          </div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground sm:text-[34px]">
            {greeting()},{' '}
            <span className="font-serif font-light italic text-[var(--pave-orange)]">{firstName}.</span>
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Here&apos;s your payment activity for{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            .
          </p>
        </div>

        <Link
          href="/checkout-links"
          className="group inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[13.5px] font-medium text-background shadow-lg transition-all hover:bg-[var(--pave-orange)] hover:text-white hover:shadow-[0_10px_30px_-8px_rgba(208,82,0,0.6)] active:scale-95"
        >
          <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
          New checkout link
        </Link>
      </motion.div>

      <StatsCards balance={balance} payments={payments} activities={activities} />

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <ActivityChart payments={payments} />
        <QuickActions />
      </div>

      <RecentActivityTable activities={activities} />
    </div>
  );
}

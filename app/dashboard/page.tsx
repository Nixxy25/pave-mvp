'use client';

import { useEffect, useState } from 'react';
import { getUserProfile, getStats } from '@/lib/api';
import { useBalance } from '@/hooks/useBalance';
import { usePayments } from '@/hooks/usePayments';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import type { Merchant, AccountStats, Payment, Withdrawal } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTableHeader, type TableColumn } from '@/components/ui/data-table';
import Link from 'next/link';

// Activity table columns - single source of truth
const ACTIVITY_COLUMNS: TableColumn[] = [
  { key: 'type', label: 'Type', className: 'px-5' },
  { key: 'customer', label: 'Customer / Destination', className: 'px-5' },
  { key: 'amount', label: 'Amount', className: 'px-5' },
  { key: 'usdc', label: 'USDC', className: 'px-5' },
  { key: 'stellarTx', label: 'Stellar TX', className: 'px-5' },
  { key: 'time', label: 'Time', className: 'px-5' },
  { key: 'status', label: 'Status', align: 'right', className: 'px-5' },
];

export default function DashboardPage() {
  const [user, setUser] = useState<Merchant | null>(null);
  const { balance, loading: balanceLoading } = useBalance();
  const { payments, loading: paymentsLoading } = usePayments();
  const { withdrawals, loading: withdrawalsLoading } = useWithdrawals();
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<Array<Payment | Withdrawal>>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    // Update activities when payments or withdrawals change
    if (!paymentsLoading && !withdrawalsLoading) {
      const activities = [
        ...payments.map((p: Payment) => ({ ...p, type: 'payment' as const })),
        ...withdrawals.map((w: Withdrawal) => ({ ...w, type: 'withdrawal' as const })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
      
      setRecentActivities(activities);
    }
  }, [payments, withdrawals, paymentsLoading, withdrawalsLoading]);

  const loadDashboardData = async () => {
    try {
      const [userData, statsData] = await Promise.all([
        getUserProfile(),
        getStats(),
      ]);
      
      setUser(userData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  // Calculate today's balance changes
  const calculateTodayChange = () => {
    const today = new Date().toDateString();
    
    const todayPayments = payments.filter((p: Payment) => 
      p.status === 'completed' && new Date(p.createdAt).toDateString() === today
    );
    const todayWithdrawals = withdrawals.filter((w: Withdrawal) => 
      w.status === 'completed' && new Date(w.createdAt).toDateString() === today
    );
    
    const paymentsTotal = todayPayments.reduce((sum: number, p: Payment) => sum + (p.usdcAmount || 0), 0);
    const withdrawalsTotal = todayWithdrawals.reduce((sum: number, w: Withdrawal) => sum + w.amount, 0);
    
    const usdcChange = paymentsTotal - withdrawalsTotal;
    const ngnChange = usdcChange * 1605; // USD to NGN conversion rate
    
    return { usdcChange, ngnChange };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'completed': 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success-medium)]',
      'settled': 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success-medium)]',
      'processing': 'bg-orange-100 text-orange-700 border-orange-200',
      'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'failed': 'bg-red-100 text-red-700 border-red-200',
    };
    
    return (
      <Badge variant="outline" className={`${colors[status.toLowerCase()] || 'bg-muted text-muted-foreground'} border`}>
        <div className={`mr-1 h-1.5 w-1.5 rounded-full ${status.toLowerCase() === 'completed' || status.toLowerCase() === 'settled' ? 'bg-[var(--success)]' : status.toLowerCase() === 'processing' ? 'bg-orange-500' : 'bg-gray-400'}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const loading = balanceLoading || paymentsLoading || withdrawalsLoading;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[980px] px-7 py-8 pb-20">
      <div className="mb-6.5 animate-fadeup">
        <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          Dashboard
        </div>
        <h1 className="font-serif text-[27px] font-light italic leading-tight tracking-tight text-foreground">
          Good morning, <strong className="font-medium not-italic">{user?.name.split(' ')[0] || 'there'}</strong> 👋
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Here's your payment activity — {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </p>
      </div>

      <div className="mb-5.5 flex items-center gap-3 rounded-lg border border-[var(--success-medium)] bg-[var(--success-light)] p-3 px-4 animate-fadeup" style={{ animationDelay: '0.07s' }}>
        <div className="h-2 w-2 flex-shrink-0 animate-blink rounded-full bg-[var(--success)]" />
        <div className="text-[13px] font-medium text-[var(--success)]">Pave testnet</div>
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-6.5 animate-fadeup" style={{ animationDelay: '0.14s' }}>
        {(() => {
          const { usdcChange, ngnChange } = calculateTodayChange();
          const todayActivityCount = recentActivities.filter(a => {
            const today = new Date().toDateString();
            return new Date(a.createdAt).toDateString() === today;
          }).length;
          
          return [
            { 
              label: 'Available Balance', 
              value: `$${balance.usdc.toLocaleString()}`, 
              sub: 'USDC · Stellar wallet', 
              change: `${usdcChange >= 0 ? '+' : ''}$${Math.abs(usdcChange).toLocaleString()} today`,
              positive: usdcChange >= 0
            },
            { 
              label: 'NGN Equivalent', 
              value: `₦${balance.ngn.toLocaleString()}`, 
              sub: 'Live Stellar rate', 
              change: `${ngnChange >= 0 ? '+' : ''}₦${Math.abs(ngnChange).toLocaleString()}`,
              positive: ngnChange >= 0
            },
            { 
              label: 'Activity Today', 
              value: todayActivityCount.toString(), 
              sub: 'Payments & withdrawals', 
              change: todayActivityCount === 0 ? 'Just started' : `${todayActivityCount} transaction${todayActivityCount !== 1 ? 's' : ''}`,
              positive: true
            },
            { 
              label: 'Avg Settle Time', 
              value: '5s', 
              sub: 'Stellar block time', 
              change: 'Live network avg',
              positive: true
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-[14px] border bg-card p-4.5 px-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] transition-shadow hover:shadow-[0_1px_3px_rgba(0,0,0,.08),0_1px_2px_rgba(0,0,0,.04)]"
            >
              <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.5px] text-muted-foreground">
                {stat.label}
              </div>
              <div className="mb-1 font-serif text-[30px] font-light italic leading-none tracking-tighter text-foreground">
                {stat.value}
              </div>
              <div className="text-[12px] text-muted-foreground">{stat.sub}</div>
              <div className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11.5px] ${
                stat.positive 
                  ? 'border-[var(--success-medium)] bg-[var(--success-light)] text-[var(--success)]'
                  : 'border-red-200 bg-red-50 text-red-600'
              }`}>
                {stat.positive ? '↑' : '↓'} {stat.change}
              </div>
            </div>
          ));
        })()}
      </div>

      <div className="rounded-[14px] border bg-card shadow-sm animate-fadeup" style={{ animationDelay: '0.21s' }}>
        <div className="flex items-center justify-between border-b p-5 pb-4">
          <div>
            <h2 className="font-serif text-[19px] font-light italic text-foreground">
              Recent Activity
            </h2>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Live feed — updates on each ledger close
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/payments" className="rounded-lg border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground">
              View All
            </Link>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {recentActivities.length === 0 ? (
            <div className="px-6 py-12 text-center text-[13.5px] text-muted-foreground">
              No activity yet. <Link href="/checkout-links" className="font-medium text-[var(--pave-orange)] hover:underline">Create your first checkout link</Link> to get started.
            </div>
          ) : (
            <table className="w-full">
              <DataTableHeader columns={ACTIVITY_COLUMNS} />
              <tbody>
                {recentActivities.map((activity: any) => {
                  const isPayment = activity.type === 'payment';
                  const timeDiff = Date.now() - new Date(activity.createdAt).getTime();
                  const timeStr = timeDiff < 60000 ? `${Math.floor(timeDiff / 1000)}s` : 
                                  timeDiff < 3600000 ? `${Math.floor(timeDiff / 60000)}m` : 
                                  `${Math.floor(timeDiff / 3600000)}h`;
                  
                  return (
                    <tr key={activity.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {isPayment ? (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--success-light)]">
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--success)]">
                                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              </svg>
                            </div>
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100">
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-orange-600">
                                <path d="M7 12V2M4 9l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}
                          <span className="text-[13px] font-medium text-foreground">
                            {isPayment ? 'Payment' : 'Withdrawal'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {isPayment ? (
                            <>
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--pave-orange)] to-[#ff8a00] font-mono text-[11px] font-medium text-white">
                                {getInitials(activity.payer.name)}
                              </div>
                              <div>
                                <div className="text-[13.5px] font-medium text-foreground">{activity.payer.name}</div>
                                <div className="font-mono text-[11.5px] text-muted-foreground">
                                  {activity.description || activity.source} · {activity.payer.country}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div>
                              <div className="text-[13.5px] font-medium text-foreground">{activity.destination?.bankName || 'Bank Account'}</div>
                              <div className="font-mono text-[11.5px] text-muted-foreground">
                                {activity.destination?.accountNumber || 'N/A'}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-[13.5px] font-medium text-foreground">
                          {activity.currency} {activity.amount.toLocaleString()}
                        </div>
                        <div className="font-mono text-[11.5px] text-muted-foreground">
                          {isPayment ? activity.method : 'Bank transfer'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[13.5px] font-medium text-[var(--success)]">
                          ${(isPayment ? activity.usdcAmount : activity.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <code className="font-mono text-[12px] text-[var(--stellar)]">
                          {activity.stellarTxHash || 'pending...'}
                        </code>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[12px] text-muted-foreground">{timeStr}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {getStatusBadge(activity.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

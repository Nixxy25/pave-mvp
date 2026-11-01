'use client';

import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/PageLayout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/merchant/auth/AuthContext';
import { getStats } from '@/features/merchant/api/stats';
import { SignInPrompt } from '@/features/merchant/components/SignInPrompt';
import { Button } from '@/components/ui/button';
import type { AccountStats } from '@/types';
import { ProfileCard } from './ProfileCard';
import { AccountStatsCard } from './AccountStatsCard';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    getStats()
      .then((value) => {
        setStats(value);
        setStatsError(null);
      })
      .catch((error: unknown) => {
        console.error('[merchant-account] Ledger statistics unavailable:', error);
        setStatsError('Verified ledger statistics are temporarily unavailable.');
      });
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push('/dashboard');
  };

  const userIcon = <User aria-hidden="true" className="size-8 stroke-[1.5] text-text-muted" />;

  if (!isAuthenticated) {
    return (
      <PageContainer narrow>
        <PageHeader
          className="animate-fadeup"
          title="Account"
          description="Manage your account information and preferences"
        />
        <SignInPrompt
          title="Sign In Required"
          description="Please sign in to view your account profile"
          icon={userIcon}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer narrow>
      <PageHeader
        className="animate-fadeup"
        title="Account"
        description="Manage your account information and preferences"
      />

      <div className="space-y-6">
          <ProfileCard
            fullName={user?.fullName || ''}
            email={user?.email || ''}
          />

          {statsError ? (
            <div role="alert" className="border border-status-failed/30 bg-status-failed-bg p-4 text-sm text-status-failed">{statsError}</div>
          ) : stats ? (
            <AccountStatsCard stats={stats} />
          ) : (
            <p className="text-sm text-text-secondary">Loading verified ledger statistics…</p>
          )}

          <div className="rounded-2xl border bg-card p-4 animate-fadeup sm:p-6" style={{ animationDelay: '0.28s' }}>
            <h2 className="mb-4 text-base font-semibold text-text-primary">
              Sign Out
            </h2>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="font-medium text-text-primary">Sign Out</div>
                  <div className="text-sm text-text-secondary">Sign out of your account</div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }
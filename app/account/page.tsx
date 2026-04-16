'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, getStats } from '@/lib/api';
import type { AccountStats } from '@/types';
import { Badge } from '@/components/ui/badge';

type ApiData = {
  apiKey: string;
  secretKey: string;
  stellarWallet: string;
};

export default function AccountPage() {
  const { user: authUser } = useAuth();
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [stats, setStats] = useState<AccountStats | null>(null);

  useEffect(() => {
    getUserProfile()
      .then(profile => setApiData({
        apiKey: profile.apiKey,
        secretKey: profile.secretKey,
        stellarWallet: profile.stellarWallet,
      }))
      .catch(() => {});
    getStats().then(setStats).catch(() => {});
  }, []);

  if (!authUser) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">No user data found</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6 pb-20 sm:px-7 sm:py-8">
      <div className="mb-6 animate-fadeup">
        <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          Account
        </div>
        <h1 className="font-serif text-[24px] font-light italic leading-tight tracking-tight text-foreground sm:text-[27px]">
          Your Profile
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="rounded-[14px] border bg-card p-4 shadow-sm animate-fadeup sm:p-6" style={{ animationDelay: '0.07s' }}>
          <h2 className="mb-4 font-serif text-lg font-light italic text-foreground">
            Profile Information
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-medium text-foreground">Full Name</div>
                <div className="text-sm text-foreground">{authUser.fullName}</div>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-foreground">Business Name</div>
                <div className="text-sm text-foreground">{authUser.businessName}</div>
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-foreground">Email Address</div>
              <div className="text-sm text-foreground">{authUser.email}</div>
            </div>

            {apiData?.stellarWallet && (
              <div>
                <div className="mb-1 text-xs font-medium text-foreground">Stellar Wallet Address</div>
                <div className="font-mono text-sm text-foreground">{apiData.stellarWallet}</div>
              </div>
            )}

            <div>
              <div className="mb-1 text-xs font-medium text-foreground">Plan</div>
              <Badge className="bg-purple-100 text-purple-700">Free</Badge>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="rounded-[14px] border bg-card p-4 shadow-sm animate-fadeup sm:p-6" style={{ animationDelay: '0.14s' }}>
          <h2 className="mb-4 font-serif text-lg font-light italic text-foreground">
            API Credentials
          </h2>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">Public Key</div>
                {apiData && (
                  <button
                    onClick={() => navigator.clipboard.writeText(apiData.apiKey)}
                    className="text-xs text-[var(--pave-orange)] hover:underline"
                  >
                    Copy
                  </button>
                )}
              </div>
              <div className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground sm:text-sm">
                {apiData?.apiKey ?? '—'}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">Secret Key</div>
                {apiData && (
                  <button
                    onClick={() => navigator.clipboard.writeText(apiData.secretKey)}
                    className="text-xs text-[var(--pave-orange)] hover:underline"
                  >
                    Copy
                  </button>
                )}
              </div>
              <div className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground sm:text-sm">
                {apiData?.secretKey ?? '—'}
              </div>
              <div className="mt-1 text-xs text-foreground">
                Keep this secret! Never share or commit to version control
              </div>
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="rounded-[14px] border bg-card p-4 shadow-sm animate-fadeup sm:p-6" style={{ animationDelay: '0.21s' }}>
          <h2 className="mb-4 font-serif text-lg font-light italic text-foreground">
            Account Statistics
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="text-center">
              <div className="font-serif text-2xl font-light italic text-foreground">
                {stats?.paymentCount ?? 0}
              </div>
              <div className="mt-1 text-xs text-foreground">Total Payments</div>
            </div>
            <div className="text-center">
              <div className="font-serif text-2xl font-light italic text-foreground">
                ${stats?.totalVolume.toLocaleString() ?? '0'}
              </div>
              <div className="mt-1 text-xs text-foreground">Total Volume</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { getUserProfile, getStats } from '@/lib/api';
import type { Merchant, AccountStats } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function AccountPage() {
  const [user, setUser] = useState<Merchant | null>(null);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const [userData, statsData] = await Promise.all([
        getUserProfile(),
        getStats(),
      ]);
      setUser(userData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading account...</div>
      </div>
    );
  }

  if (!user) {
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
                <div className="text-sm text-foreground">{user.name}</div>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-foreground">Business Name</div>
                <div className="text-sm text-foreground">{user.businessName}</div>
              </div>
            </div>
            
            <div>
              <div className="mb-1 text-xs font-medium text-foreground">Email Address</div>
              <div className="text-sm text-foreground">{user.email}</div>
            </div>
            
            <div>
              <div className="mb-1 text-xs font-medium text-foreground">Stellar Wallet Address</div>
              <div className="font-mono text-sm text-foreground">{user.stellarWallet}</div>
            </div>
            
            <div>
              <div className="mb-1 text-xs font-medium text-foreground">Plan</div>
              <Badge className="bg-purple-100 text-purple-700">{user.plan}</Badge>
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
                <button
                  onClick={() => navigator.clipboard.writeText(user.apiKey)}
                  className="text-xs text-[var(--pave-orange)] hover:underline"
                >
                  Copy
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground sm:text-sm">
                {user.apiKey}
              </div>
            </div>
            
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">Secret Key</div>
                <button
                  onClick={() => navigator.clipboard.writeText(user.secretKey)}
                  className="text-xs text-[var(--pave-orange)] hover:underline"
                >
                  Copy
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground sm:text-sm">
                {user.secretKey}
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
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="font-serif text-2xl font-light italic text-foreground">
                {stats?.paymentCount || 0}
              </div>
              <div className="mt-1 text-xs text-foreground">Total Payments</div>
            </div>
            <div className="text-center">
              <div className="font-serif text-2xl font-light italic text-foreground">
                ${stats?.totalVolume.toLocaleString() || '0'}
              </div>
              <div className="mt-1 text-xs text-foreground">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="font-serif text-2xl font-light italic text-foreground">
                {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <div className="mt-1 text-xs text-foreground">Member Since</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

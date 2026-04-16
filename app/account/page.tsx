'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { getUserProfile, getStats } from '@/lib/api';
import type { AccountStats } from '@/types';
import { ProfileCard } from './ProfileCard';
import { APICredentialsCard } from './APICredentialsCard';
import { AccountStatsCard } from './AccountStatsCard';

type ApiData = {
  apiKey: string;
  secretKey: string;
  stellarWallet: string;
};

export default function AccountPage() {
  const { user: authUser } = useAuth();
  const { address: walletAddress, connecting, connect } = useWallet();
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [stats, setStats] = useState<AccountStats | null>(null);

  useEffect(() => {
    getUserProfile()
      .then((profile) =>
        setApiData({
          apiKey: profile.apiKey,
          secretKey: profile.secretKey,
          stellarWallet: profile.stellarWallet,
        }),
      )
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
        <ProfileCard
          fullName={authUser.fullName}
          businessName={authUser.businessName}
          email={authUser.email}
          walletAddress={walletAddress}
          connecting={connecting}
          onConnect={connect}
        />

        <APICredentialsCard
          apiKey={apiData?.apiKey}
          secretKey={apiData?.secretKey}
        />

        <AccountStatsCard stats={stats} />
      </div>
    </div>
  );
}

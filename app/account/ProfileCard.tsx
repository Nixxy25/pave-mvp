'use client';

import { ShortAddress } from '@/components/ShortAddress';

interface ProfileCardProps {
  fullName: string;
  email: string;
  walletAddress: string | null;
}

export function ProfileCard({
  fullName,
  email,
  walletAddress,
}: ProfileCardProps) {
  return (
    <div
      className="rounded-[14px] border bg-card p-4 shadow-sm animate-fadeup sm:p-6"
      style={{ animationDelay: '0.07s' }}
    >
      <h2 className="mb-4 font-serif text-lg font-light italic text-foreground">
        Profile Information
      </h2>

      <div className="space-y-4">
        <div>
          <div className="mb-1 text-xs font-medium text-foreground">Full Name</div>
          <div className="text-sm text-foreground">{fullName}</div>
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-foreground">Email Address</div>
          <div className="text-sm text-foreground">{email}</div>
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-foreground">Stellar Wallet Address</div>
          {walletAddress ? (
            <div className="rounded-lg bg-muted p-2.5">
              <ShortAddress
                address={walletAddress}
                startChars={8}
                endChars={8}
                showCopy
                className="text-xs text-foreground"
              />
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              Sign in to get your Stellar wallet
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

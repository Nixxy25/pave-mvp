'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProfileCardProps {
  fullName: string;
  businessName: string;
  email: string;
  walletAddress: string | null;
  connecting: boolean;
  onConnect: () => void;
}

export function ProfileCard({
  fullName,
  businessName,
  email,
  walletAddress,
  connecting,
  onConnect,
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-medium text-foreground">Full Name</div>
            <div className="text-sm text-foreground">{fullName}</div>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-foreground">Business Name</div>
            <div className="text-sm text-foreground">{businessName}</div>
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-foreground">Email Address</div>
          <div className="text-sm text-foreground">{email}</div>
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-foreground">Stellar Wallet Address</div>
          {walletAddress ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 overflow-x-auto rounded-lg bg-muted p-2.5 font-mono text-xs text-foreground">
                {walletAddress}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(walletAddress)}
                className="flex-shrink-0 text-xs text-[var(--pave-orange)] hover:underline"
              >
                Copy
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">No wallet connected</span>
              <Button
                size="sm"
                variant="outline"
                disabled={connecting}
                onClick={onConnect}
                className="h-7 px-3 text-[12px]"
              >
                {connecting ? 'Connecting…' : 'Connect Wallet'}
              </Button>
            </div>
          )}
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-foreground">Plan</div>
          <Badge className="bg-purple-100 text-purple-700">Free</Badge>
        </div>
      </div>
    </div>
  );
}

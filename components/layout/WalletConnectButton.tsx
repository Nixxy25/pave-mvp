'use client';

import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ShortAddress } from '@/components/ShortAddress';

export function WalletConnectButton() {
  const { user, isAuthenticated, login } = useAuth();
  const address = user?.stellarAddress || null;

  if (isAuthenticated && address) {
    return (
      <button
        title={address}
        className="hidden items-center gap-1.5 rounded-full border border-[var(--stellar)]/30 bg-[var(--stellar)]/10 px-3 py-1 text-[11.5px] text-[var(--stellar)] transition-colors hover:bg-[var(--stellar)]/20 sm:flex"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--stellar)]" />
        <ShortAddress address={address} startChars={4} endChars={4} />
      </button>
    );
  }

  if (isAuthenticated) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={login}
      className="hidden h-[32px] gap-1.5 px-3 text-[12.5px] font-medium sm:flex"
    >
      <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
      Connect Wallet
    </Button>
  );
}

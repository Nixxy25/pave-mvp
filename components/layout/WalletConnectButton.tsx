'use client';

import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';

export function WalletConnectButton() {
  const { address, connecting, connect, disconnect } = useWallet();

  if (address) {
    return (
      <button
        onClick={disconnect}
        title="Disconnect wallet"
        className="hidden items-center gap-1.5 rounded-full border border-[var(--stellar)]/30 bg-[var(--stellar)]/10 px-3 py-1 font-mono text-[11.5px] text-[var(--stellar)] transition-colors hover:bg-[var(--stellar)]/20 sm:flex"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--stellar)]" />
        {address.slice(0, 4)}…{address.slice(-4)}
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={connecting}
      onClick={connect}
      className="hidden h-[32px] gap-1.5 px-3 text-[12.5px] font-medium sm:flex"
    >
      <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
      {connecting ? 'Connecting…' : 'Connect Wallet'}
    </Button>
  );
}

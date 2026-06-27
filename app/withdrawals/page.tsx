'use client';

import { Lock } from 'lucide-react';

export default function WithdrawalsPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-7 sm:py-8">
      <div className="mb-6 animate-fadeup">
        <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          Withdrawals
        </div>
        <h1 className="font-serif text-[24px] font-light italic leading-tight tracking-tight text-foreground sm:text-[27px]">
          Bank Withdrawals
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Move USDC from your Pave wallet to any local bank
        </p>
      </div>

      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-lg font-medium text-foreground">Coming Soon</h2>
          <p className="text-sm text-muted-foreground">
            Bank withdrawals will be available shortly
          </p>
        </div>
      </div>
    </div>
  );
}

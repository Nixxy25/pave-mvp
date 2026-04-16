'use client';

import { useBalance } from '@/hooks/useBalance';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { WithdrawalDialog } from './WithdrawalDialog';
import { WithdrawalsTable } from './WithdrawalsTable';

export default function WithdrawalsPage() {
  const { withdrawals, loading, refetch: refetchWithdrawals } = useWithdrawals();
  const { balance, refetch: refetchBalance } = useBalance();

  const handleSuccess = async () => {
    await Promise.all([refetchWithdrawals(), refetchBalance()]);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 pb-20 sm:px-7 sm:py-8">
      <div className="mb-6 flex animate-fadeup flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
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

        <WithdrawalDialog balance={balance} onSuccess={handleSuccess} />
      </div>

      <WithdrawalsTable withdrawals={withdrawals} loading={loading} />
    </div>
  );
}

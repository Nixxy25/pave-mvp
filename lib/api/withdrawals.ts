import { getUserData, setUserData } from './helpers';
import { getBalance } from './balance';
import { logAPICall } from './logs';
import type { Withdrawal, CreateWithdrawalData } from '@/types';

export async function getWithdrawals(): Promise<Withdrawal[]> {
  return getUserData<Withdrawal[]>('withdrawals', []);
}

export async function createWithdrawal(data: CreateWithdrawalData): Promise<Withdrawal> {
  const withdrawals = await getUserData<Withdrawal[]>('withdrawals', []);
  const currentBalance = await getBalance();

  if (currentBalance.usdc < data.amount) throw new Error('Insufficient balance');

  const bankAccountId = `bank_${data.bankName.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}`;
  const maskedAccountNumber =
    data.accountNumber.slice(0, -4).replace(/./g, '•') + data.accountNumber.slice(-4);

  const newWithdrawal: Withdrawal = {
    id: `pout_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    amount: data.amount,
    currency: data.currency,
    destination: {
      id: bankAccountId,
      bankName: data.bankName,
      bankCode: '000',
      accountNumber: maskedAccountNumber,
      accountName: data.accountName,
      country: 'NG',
    },
    narration: data.narration,
    stellarTxHash: `${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
    estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  };

  withdrawals.push(newWithdrawal);
  await setUserData('withdrawals', withdrawals);
  await logAPICall('POST', '/v1/payouts', 201, JSON.stringify(data));

  return newWithdrawal;
}

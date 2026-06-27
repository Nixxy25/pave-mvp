import { authFetch } from '../fetch-api';
import type { Merchant } from '@/types';

interface MerchantRow {
  privy_user_id: string;
  email: string;
  full_name: string;
  stellar_address: string;
  stellar_wallet_id: string;
  api_key: string;
  api_secret: string;
  created_at: string;
}

export async function getUserProfile(): Promise<Merchant> {
  const res = await authFetch('/api/merchant');
  if (!res.ok) throw new Error('Not authenticated');

  const { merchant } = (await res.json()) as { merchant: MerchantRow };

  return {
    id: merchant.privy_user_id,
    name: merchant.full_name || merchant.email?.split('@')[0] || 'User',
    email: merchant.email,
    createdAt: merchant.created_at,
    apiKey: merchant.api_key,
    secretKey: merchant.api_secret,
    stellarWallet: merchant.stellar_address,
    stellarWalletAddress: merchant.stellar_address,
    preferences: {
      emailNotifications: true,
      autoWithdrawal: false,
      stellarExplorerLinks: true,
      twoFactorAuth: false,
    },
  } as Merchant;
}


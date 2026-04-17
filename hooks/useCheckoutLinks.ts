import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/fetch-api';
import type { CheckoutLink } from '@/types';

function rowToCheckoutLink(row: Record<string, unknown>): CheckoutLink {
  return {
    id: row.id as string,
    paymentId: row.id as string,
    url: `${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/${row.id}`,
    amount: row.amount as number,
    currency: row.currency as string,
    description: row.description as string,
    acceptedCurrencies: row.accepted_currencies as string[],
    settlementAsset: row.settlement_asset as string,
    stellarWalletAddress: row.stellar_wallet_address as string | undefined,
    equivalents: (row.equivalents as Record<string, number>) || {},
    expiresAt: row.expires_at as string,
    createdAt: row.created_at as string,
    status: row.status as 'active' | 'expired' | 'completed',
    merchantName: row.merchant_name as string | undefined,
    merchantVerified: row.merchant_verified as boolean | undefined,
  };
}

export function useCheckoutLinks() {
  const [links, setLinks] = useState<CheckoutLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch('/api/checkout-links');
      if (!res.ok) throw new Error('Failed to fetch checkout links');
      const { data } = await res.json();
      setLinks((data || []).map(rowToCheckoutLink));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  return { links, loading, error, refetch: loadLinks };
}

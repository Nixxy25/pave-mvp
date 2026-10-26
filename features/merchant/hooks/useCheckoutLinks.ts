import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/fetch-api';
import { rowToCheckoutLink } from '@/features/payments/mappers';
import type { CheckoutLink } from '@/types';

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

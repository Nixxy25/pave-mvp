import { useEffect, useState } from 'react';
import { getCheckoutLinks } from '@/lib/api';
import type { CheckoutLink } from '@/types';

export function useCheckoutLinks() {
  const [links, setLinks] = useState<CheckoutLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCheckoutLinks();
      setLinks(data);
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

import { useEffect, useState } from 'react';
import {
  getMerchantTransactions,
} from '@/features/merchant/api/ledger';
import type { MerchantTransactionPage } from '@/features/merchant/types/ledger';

export function useLedgerTransactions(options: {
  enabled: boolean;
  page: number;
  status: string;
  search: string;
}) {
  const { enabled, page, status, search } = options;
  const requestKey = `${enabled}:${page}:${status}:${search}`;
  const [data, setData] = useState<MerchantTransactionPage | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [completedRequest, setCompletedRequest] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    getMerchantTransactions({ page, status, search })
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason : new Error('Merchant transactions are unavailable.'));
      })
      .finally(() => { if (active) setCompletedRequest(requestKey); });
    return () => { active = false; };
  }, [enabled, page, status, search, requestKey]);

  return { data, loading: enabled && completedRequest !== requestKey, error };
}

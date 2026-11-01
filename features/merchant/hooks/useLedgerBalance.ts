import { useCallback, useEffect, useState } from 'react';
import { getMerchantLedgerData, type MerchantLedgerData } from '@/features/merchant/api/ledger';

export function useLedgerBalance(enabled: boolean) {
  const [data, setData] = useState<MerchantLedgerData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    getMerchantLedgerData()
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason : new Error('Ledger balances are unavailable.'));
      })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [enabled, reloadCount]);

  const refetch = useCallback(() => setReloadCount((count) => count + 1), []);
  return { data, loading: enabled && !loaded, error, refetch };
}

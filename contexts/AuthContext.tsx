'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { setTokenGetter, setUserIdGetter } from '@/lib/fetch-api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  userId: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  authProvider: 'email' | 'google' | 'wallet';
  stellarAddress: string;
  apiKey: string;
  apiSecret: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

// Shape of a row from the Supabase merchants table
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

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    ready,
    authenticated,
    user: privyUser,
    logout: privyLogout,
    getAccessToken,
    login: privyLogin,
  } = usePrivy();

  const [merchant, setMerchant] = useState<MerchantRow | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // ── Bridge: expose Privy token + userId to non-React API modules ──────────
  useEffect(() => {
    setTokenGetter(getAccessToken);
    setUserIdGetter(() => privyUser?.id ?? null);
  }, [getAccessToken, privyUser?.id]);

  // ── Derive email/name from Privy at component level so they can be used as deps ──
  const privyEmail = useMemo(
    () =>
      privyUser?.email?.address ||
      (privyUser?.google as { email?: string } | null)?.email ||
      '',
    [privyUser]
  );
  const privyFullName = useMemo(
    () =>
      (privyUser?.google as { name?: string } | null)?.name ||
      privyEmail.split('@')[0] ||
      '',
    [privyUser, privyEmail]
  );

  // ── Load or create merchant profile whenever auth state changes ───────────
  useEffect(() => {
    if (!ready) return;

    const doLoad = async (): Promise<MerchantRow | null> => {
      if (!authenticated || !privyUser?.id) return null;

      const token = await getAccessToken();
      const authHeader = { Authorization: `Bearer ${token}` };

      // 1. Try to load existing merchant record
      const res = await fetch('/api/merchant', { headers: authHeader });

      if (res.ok) {
        const { merchant: existing } = (await res.json()) as { merchant: MerchantRow };

        // 2a. Create Stellar wallet if not yet assigned
        if (!existing.stellar_address) {
          const walletRes = await fetch('/api/stellar-wallet', {
            method: 'POST',
            headers: authHeader,
          });
          if (walletRes.ok) {
            const { address } = await walletRes.json();
            return { ...existing, stellar_address: address };
          }
        }
        return existing;
      }

      if (res.status === 404) {
        // 3. First login — create merchant row in Supabase
        const createRes = await fetch('/api/merchant', {
          method: 'POST',
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: privyEmail, full_name: privyFullName }),
        });
        if (!createRes.ok) return null;
        const { merchant: created } = (await createRes.json()) as { merchant: MerchantRow };

        // 2b. Create Stellar wallet immediately after merchant creation
        const walletRes = await fetch('/api/stellar-wallet', {
          method: 'POST',
          headers: authHeader,
        });
        if (walletRes.ok) {
          const { address } = await walletRes.json();
          return { ...created, stellar_address: address };
        }
        return created;
      }

      return null;
    };

    doLoad()
      .then((m) => setMerchant(m))
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, privyUser?.id, privyEmail, privyFullName, refreshTick]);

  // ── Derived user object from Supabase merchant row ────────────────────────
  const user: User | null = merchant
    ? {
        userId: merchant.privy_user_id,
        email: merchant.email,
        fullName: merchant.full_name,
        stellarAddress: merchant.stellar_address,
        emailVerified: true,
        authProvider: (privyUser?.google ? 'google' : 'email') as 'email' | 'google',
        apiKey: merchant.api_key,
        apiSecret: merchant.api_secret,
      }
    : null;

  // ── Actions ───────────────────────────────────────────────────────────────
  const refreshUser = useCallback(() => setRefreshTick((t) => t + 1), []);

  const isLoading = !ready || (authenticated && merchant === null);
  const isAuthenticated = authenticated && !!merchant;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login: privyLogin,
        logout: async () => {
          await privyLogout();
          setMerchant(null);
        },
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

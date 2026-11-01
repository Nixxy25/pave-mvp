'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { PaveLogo } from '@/components/brand/PaveLogo';
import { Button } from '@/components/ui/button';

export function AdminLogin() {
  const router = useRouter();
  const { ready, authenticated, login, logout, getAccessToken } = usePrivy();
  const [message, setMessage] = useState<string | null>(null);
  const [canSwitchAccount, setCanSwitchAccount] = useState(false);

  useEffect(() => {
    if (!ready || !authenticated) return;

    let cancelled = false;
    setCanSwitchAccount(false);
    setMessage('Checking Admin access…');

    const establishAdminSession = async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error('Your Pave session has expired. Please sign in again.');
        }

        const response = await fetch('/api/admin/session', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 403) {
          throw new Error('This Pave account is not authorized for Admin access.');
        }
        if (!response.ok) {
          throw new Error('Unable to verify Admin access. Please try again.');
        }
        if (cancelled) return;

        router.replace('/admin');
        router.refresh();
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'Unable to verify Admin access.');
          setCanSwitchAccount(true);
        }
      }
    };

    void establishAdminSession();
    return () => {
      cancelled = true;
    };
  }, [authenticated, getAccessToken, ready, router]);

  const handleSwitchAccount = async () => {
    try {
      await logout();
      setMessage(null);
      setCanSwitchAccount(false);
    } catch (error) {
      console.error('[admin] Failed to sign out:', error);
      setMessage('Unable to sign out. Please try again.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md border bg-card p-8 text-center shadow-sm ring-1 ring-foreground/5">
        <div className="mb-6 flex justify-center">
          <PaveLogo size={36} priority />
        </div>
        <h1 className="mb-1.5 text-xl font-semibold tracking-tight text-text-primary">Admin sign in</h1>
        <p className="mb-6 text-sm text-text-secondary">
          Sign in with an account authorized by the Pave operations team.
        </p>
        {!authenticated && (
          <Button onClick={login} disabled={!ready} className="w-full">
            {ready ? 'Sign in' : 'Loading…'}
          </Button>
        )}
        {message && (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            {message}
          </p>
        )}
        {canSwitchAccount && (
          <Button onClick={handleSwitchAccount} variant="outline" className="mt-4 w-full">
            Sign out and choose another account
          </Button>
        )}
      </section>
    </main>
  );
}

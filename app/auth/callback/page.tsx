'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, needsBusinessName } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading
    if (!isLoading) {
      if (isAuthenticated) {
        if (needsBusinessName) {
          router.push('/complete-profile');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Auth failed, go back to login
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, needsBusinessName, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--pave-orange)]" />
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}

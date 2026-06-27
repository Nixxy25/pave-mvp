'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { ThemeProvider } from '@/components/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            refetchInterval: 30 * 1000, // Refetch every 30 seconds
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        config={{
          loginMethods: ['email', 'google'],
          appearance: {
            theme: 'light',
            accentColor: '#e8602c',
            logo: 'https://res.cloudinary.com/dj1f8plkn/image/upload/f_auto,q_auto/7_sdtfea',
          },
        }}
      >
        <AuthProvider>
          <WalletProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </WalletProvider>
        </AuthProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}

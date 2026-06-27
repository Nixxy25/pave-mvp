'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { AuthProvider } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { ThemeProvider } from '@/components/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
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
  );
}

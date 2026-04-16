'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';

interface WalletContextValue {
  address: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue>({
  address: null,
  connecting: false,
  connect: async () => {},
  disconnect: async () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

const STORAGE_KEY = 'pave_stellar_address';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || initialized.current) return;
    initialized.current = true;

    const persisted = localStorage.getItem(STORAGE_KEY);
    if (persisted) setAddress(persisted);

    (async () => {
      try {
        const { StellarWalletsKit } = await import('@creit.tech/stellar-wallets-kit/sdk');
        const { defaultModules } = await import('@creit.tech/stellar-wallets-kit/modules/utils');
        const { KitEventType, Networks } = await import('@creit.tech/stellar-wallets-kit/types');

        StellarWalletsKit.init({
          modules: defaultModules(),
          network: Networks.TESTNET,
        });

        StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
          const addr = event.payload.address || null;
          setAddress(addr);
          if (addr) {
            localStorage.setItem(STORAGE_KEY, addr);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        });

        StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
          setAddress(null);
          localStorage.removeItem(STORAGE_KEY);
        });

        if (persisted) {
          try {
            const { address: kitAddr } = await StellarWalletsKit.getAddress();
            if (kitAddr) setAddress(kitAddr);
          } catch {
          }
        }
      } catch {
      }
    })();
  }, []);

  const connect = async () => {
    if (typeof window === 'undefined') return;
    setConnecting(true);
    try {
      const { StellarWalletsKit } = await import('@creit.tech/stellar-wallets-kit/sdk');
      const { address: addr } = await StellarWalletsKit.authModal();
      setAddress(addr);
      localStorage.setItem(STORAGE_KEY, addr);
    } catch {
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (typeof window === 'undefined') return;
    try {
      const { StellarWalletsKit } = await import('@creit.tech/stellar-wallets-kit/sdk');
      await StellarWalletsKit.disconnect();
    } catch {
    } finally {
      setAddress(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <WalletContext.Provider value={{ address, connecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

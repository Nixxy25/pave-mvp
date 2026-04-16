'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';

interface StellarPaymentProps {
  merchantAddress: string;
  xlmAmount: number; // amount in XLM to send (testnet)
  onSuccess: (txHash: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

export function StellarPayment({
  merchantAddress,
  xlmAmount,
  onSuccess,
  onError,
  disabled = false,
}: StellarPaymentProps) {
  const { address, connecting, connect } = useWallet();
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(merchantAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePay = async () => {
    if (!address) return;
    setProcessing(true);

    try {
      // Dynamically import stellar-sdk (avoids SSR issues)
      const { TransactionBuilder, Asset, Networks, Operation, Memo } = await import('@stellar/stellar-sdk');
      const { Horizon } = await import('@stellar/stellar-sdk');

      const server = new Horizon.Server('https://horizon-testnet.stellar.org');

      // Load the customer's account
      const account = await server.loadAccount(address);

      // Build the transaction
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: merchantAddress,
            asset: Asset.native(),
            amount: xlmAmount.toFixed(7),
          })
        )
        .addMemo(Memo.text('Pave checkout'))
        .setTimeout(180)
        .build();

      // Sign via the connected wallet
      const { StellarWalletsKit } = await import('@creit.tech/stellar-wallets-kit/sdk');
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(tx.toXDR(), {
        networkPassphrase: Networks.TESTNET,
        address,
      });

      // Submit to testnet Horizon
      const { TransactionBuilder: TB2 } = await import('@stellar/stellar-sdk');
      const signed = TB2.fromXDR(signedTxXdr, Networks.TESTNET);
      const response = await server.submitTransaction(signed);

      onSuccess(response.hash);
    } catch (err: any) {
      const msg =
        err?.response?.data?.extras?.result_codes?.transaction ||
        err?.message ||
        'Transaction failed';
      onError(msg);
    } finally {
      setProcessing(false);
    }
  };

  // Not connected
  if (!address) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-[var(--stellar)]/40 bg-[var(--stellar)]/5 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--stellar)]/10">
          {/* Stellar-style icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21.5 7.5L3 12l18.5 4.5" stroke="var(--stellar)" strokeWidth="2" strokeLinecap="round" />
            <path d="M3 7.5l18.5 4.5L3 16.5" stroke="var(--stellar)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="text-[14px] font-medium text-foreground">Connect your Stellar wallet</div>
          <div className="mt-1 text-[12.5px] text-muted-foreground">
            You'll send <span className="font-medium">{xlmAmount.toFixed(2)} XLM</span> on testnet
          </div>
        </div>
        <Button
          onClick={connect}
          disabled={connecting}
          className="h-10 bg-[var(--stellar)] px-6 text-[13.5px] font-medium text-white hover:bg-[var(--stellar)]/90"
        >
          {connecting ? 'Connecting…' : 'Connect Wallet'}
        </Button>
      </div>
    );
  }

  // Connected — show payment UI
  return (
    <div className="space-y-4">
      {/* Sending from */}
      <div className="rounded-lg border bg-muted/40 p-3.5">
        <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Sending from
        </div>
        <div className="font-mono text-[13px] text-foreground">{truncateAddress(address)}</div>
      </div>

      {/* Sending to */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3.5">
        <div className="flex-1 min-w-0">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Merchant wallet (destination)
          </div>
          <div className="truncate font-mono text-[13px] text-foreground">{merchantAddress}</div>
        </div>
        <button
          onClick={copyAddress}
          className="flex-shrink-0 text-[11.5px] text-[var(--pave-orange)] hover:underline"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Amount */}
      <div className="flex items-center justify-between rounded-lg border border-[var(--stellar)]/20 bg-[var(--stellar)]/5 px-4 py-3">
        <span className="text-[13px] text-muted-foreground">You will send</span>
        <span className="font-mono text-[15px] font-semibold text-[var(--stellar)]">
          {xlmAmount.toFixed(2)} XLM
        </span>
      </div>

      {/* Pay button */}
      <Button
        onClick={handlePay}
        disabled={processing || disabled}
        className="h-12 w-full bg-[var(--stellar)] text-[15px] font-medium text-white hover:bg-[var(--stellar)]/90 disabled:opacity-70"
      >
        {processing ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
            Submitting to Stellar…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Pay {xlmAmount.toFixed(2)} XLM
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2 7.5h11M9 3.5l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </Button>

      <div className="text-center text-[11.5px] text-muted-foreground">
        Real testnet transaction · Stellar network · ~5s confirmation
      </div>
    </div>
  );
}

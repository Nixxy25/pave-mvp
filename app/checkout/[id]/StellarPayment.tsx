'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { ShortAddress } from '@/components/ShortAddress';
import { API_ENDPOINTS } from '@/lib/constants';

interface StellarPaymentProps {
  merchantAddress: string;
  xlmAmount: number; // amount in XLM to send (testnet)
  onSuccess: (txHash: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function StellarPayment({
  merchantAddress,
  xlmAmount,
  onSuccess,
  onError,
  disabled = false,
}: StellarPaymentProps) {
  const { address, connecting, connect, disconnect  } = useWallet();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePay = async () => {
    if (!address) return;
    setProcessing(true);

    try {
      // Dynamically import stellar-sdk (avoids SSR issues)
      const { TransactionBuilder, Asset, Networks, Operation, Memo } = await import('@stellar/stellar-sdk');
      const { Horizon } = await import('@stellar/stellar-sdk');

      const server = new Horizon.Server(API_ENDPOINTS.STELLAR_HORIZON_TESTNET);

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

      setSuccess(true);
      onSuccess(response.hash);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { extras?: { result_codes?: { operations?: string[]; transaction?: string } } } }; message?: string };
      const codes = error?.response?.data?.extras?.result_codes;
      const opCode = codes?.operations?.[0];
      const txCode = codes?.transaction;

      // Translate common Stellar error codes into readable messages
      const friendlyErrors: Record<string, string> = {
        op_no_destination: 'Merchant wallet not yet activated on testnet. Please try again in a moment.',
        op_underfunded: 'Your wallet has insufficient XLM. Fund it at laboratory.stellar.org.',
        op_no_account: 'Your Stellar account is not activated. Fund it via Friendbot first.',
        tx_bad_seq: 'Sequence number mismatch — please retry.',
      };

      const msg =
        (opCode && friendlyErrors[opCode]) ||
        (txCode && friendlyErrors[txCode]) ||
        opCode ||
        txCode ||
        error?.message ||
        'Transaction failed';

      onError(msg);
    } finally {
      setProcessing(false);
    }
  };

  // Not connected
  if (!address) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-muted/30 p-7 text-center">
        <span className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--pave-orange)] text-white shadow-[0_12px_28px_-10px_rgba(208,82,0,0.8)]">
          <Wallet className="size-6" />
        </span>
        <div className="relative mt-4 text-[16px] font-semibold text-foreground">Connect your Stellar wallet</div>
        <p className="relative mx-auto mt-1 max-w-[300px] text-[13px] text-muted-foreground">
          You&apos;ll send <span className="font-mono font-medium text-foreground">{xlmAmount.toFixed(2)} XLM</span> on
          testnet. Nothing moves until you approve it in your wallet.
        </p>
        <Button
          onClick={connect}
          disabled={connecting}
          className="relative mt-5 h-12 rounded-full bg-foreground px-8 text-[14px] text-background shadow-lg transition-all hover:bg-[var(--pave-orange)] hover:text-white hover:shadow-[0_10px_30px_-8px_rgba(208,82,0,0.6)]"
        >
          {connecting ? 'Connecting…' : 'Connect wallet'}
        </Button>
      </div>
    );
  }

  // Connected — show payment UI
  return (
    <div className="space-y-3.5">
      <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">Sending from</div>
          <button
            type="button"
            onClick={disconnect}
            className="cursor-pointer rounded-full px-2.5 py-1 text-[11.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Disconnect
          </button>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--success)] opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-[var(--success)]" />
          </span>
          <ShortAddress address={address} className="text-[13px] text-foreground" />
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
        <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
          Merchant wallet
        </div>
        <ShortAddress address={merchantAddress} showCopy className="text-[13px] text-foreground" />
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-[var(--pave-orange-light)] px-5 py-4">
        <span className="text-[13px] text-muted-foreground">You will send</span>
        <span className="font-serif text-[26px] font-light italic leading-none text-[var(--pave-orange)]">
          {xlmAmount.toFixed(2)} <span className="font-mono text-[13px] not-italic">XLM</span>
        </span>
      </div>

      <Button
        onClick={handlePay}
        disabled={processing || disabled || success}
        className="group h-13 w-full rounded-full bg-foreground py-4 text-[15px] font-medium text-background shadow-lg transition-all hover:bg-[var(--pave-orange)] hover:text-white hover:shadow-[0_10px_30px_-8px_rgba(208,82,0,0.6)] disabled:opacity-70"
      >
        {success ? (
          <span className="flex items-center gap-2">
            <Check className="size-4" /> Payment successful
          </span>
        ) : processing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Submitting to Stellar…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Pay {xlmAmount.toFixed(2)} XLM
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        )}
      </Button>

      <div className="text-center text-[11.5px] text-muted-foreground">
        Real testnet transaction · Stellar network · ~5s confirmation
      </div>
    </div>
  );
}

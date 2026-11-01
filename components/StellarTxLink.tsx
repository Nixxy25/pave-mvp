import { stellarTransactionUrl } from '@/lib/stellar-explorer';

export function StellarTxLink({ hash, network }: { hash: string; network?: string | null }) {
  const label = hash.length > 18 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;
  return (
    <a
      href={stellarTransactionUrl(network, hash)}
      target="_blank"
      rel="noreferrer"
      title="Open this transaction on the Stellar explorer"
      className="font-mono text-xs text-[var(--pave-orange)] underline-offset-2 hover:underline"
    >
      {label}
    </a>
  );
}

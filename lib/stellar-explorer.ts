// Client-safe explorer links keyed by the stored network id.
const EXPLORERS: Record<string, string> = {
  'stellar-mainnet': 'https://stellar.expert/explorer/public',
  'stellar-testnet': 'https://stellar.expert/explorer/testnet',
};

export function stellarTransactionUrl(network: string | null | undefined, hash: string): string {
  return `${EXPLORERS[network ?? ''] ?? EXPLORERS['stellar-testnet']}/tx/${hash}`;
}

export function networkLabel(network: string | null | undefined): string {
  return network === 'stellar-mainnet' || network === 'stellar-testnet' ? 'Stellar' : network ?? '—';
}

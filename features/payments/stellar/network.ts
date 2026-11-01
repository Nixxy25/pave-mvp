// The single source of truth for which Stellar network this deployment pays on.
// PAVE_STELLAR_NETWORK selects it; testnet is the default so nothing reaches mainnet by accident.
export type StellarNetworkId = 'stellar-testnet' | 'stellar-mainnet';

export interface StellarNetworkConfig {
  id: StellarNetworkId;
  mainnet: boolean;
  horizonUrl: string;
  passphrase: string;
  usdcIssuer: string;
}

const TESTNET_USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
// Circle's USDC issuer on Stellar mainnet.
const MAINNET_USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

const STELLAR_ADDRESS = /^G[A-Z2-7]{55}$/;

export function resolveStellarNetwork(env: Record<string, string | undefined> = process.env): StellarNetworkConfig {
  const selected = (env.PAVE_STELLAR_NETWORK || 'testnet').toLowerCase();
  if (selected !== 'testnet' && selected !== 'mainnet') {
    throw new Error('PAVE_STELLAR_NETWORK must be "testnet" or "mainnet".');
  }
  const mainnet = selected === 'mainnet';

  const horizonUrl = (env.STELLAR_HORIZON_URL || (mainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org'))
    .replace(/\/+$/, '');
  if (/testnet/i.test(horizonUrl) !== !mainnet) {
    throw new Error(`STELLAR_HORIZON_URL does not match PAVE_STELLAR_NETWORK=${selected}.`);
  }

  const usdcIssuer = mainnet
    ? env.STELLAR_USDC_ISSUER || MAINNET_USDC_ISSUER
    : env.STELLAR_TESTNET_USDC_ISSUER || TESTNET_USDC_ISSUER;
  if (!STELLAR_ADDRESS.test(usdcIssuer)) throw new Error('The configured USDC issuer is not a valid Stellar address.');

  return {
    id: mainnet ? 'stellar-mainnet' : 'stellar-testnet',
    mainnet,
    horizonUrl,
    passphrase: mainnet ? 'Public Global Stellar Network ; September 2015' : 'Test SDF Network ; September 2015',
    usdcIssuer,
  };
}

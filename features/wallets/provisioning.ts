import { Asset, BASE_FEE, Horizon, Keypair, Operation, TransactionBuilder, xdr } from '@stellar/stellar-sdk';
import { callRpc, rows, type Rpc } from '../payments/stellar/store.ts';
import type { StellarNetworkConfig } from '../payments/stellar/network.ts';
import { createStellarWallet, signEd25519, turnkeyConfigFromEnv } from './turnkey.ts';

const FRIENDBOT_URL = 'https://friendbot.stellar.org';

export interface MerchantWalletInfo {
  walletId: string;
  address: string;
  status: 'provisioning' | 'ready' | 'failed';
  usdcTrustline: boolean;
}

function toInfo(row: Record<string, unknown>): MerchantWalletInfo {
  return {
    walletId: String(row.result_wallet_id),
    address: String(row.result_address),
    status: row.result_status as MerchantWalletInfo['status'],
    usdcTrustline: row.result_usdc_trustline === true,
  };
}

export async function getMerchantStellarWallet(rpc: Rpc, merchantId: string): Promise<MerchantWalletInfo | null> {
  const [row] = rows(await callRpc(rpc, 'get_merchant_wallet', { p_merchant_id: merchantId, p_family: 'stellar' }));
  return row ? toInfo(row) : null;
}

async function activateAndTrust(address: string, network: StellarNetworkConfig): Promise<void> {
  const usdcIssuer = network.usdcIssuer;
  const horizon = new Horizon.Server(network.horizonUrl);
  const config = turnkeyConfigFromEnv();

  let account: Horizon.AccountResponse | null = null;
  try {
    account = await horizon.loadAccount(address);
  } catch (error) {
    if ((error as { response?: { status?: number } }).response?.status !== 404) throw error;
  }
  if (!account) {
    // Mainnet accounts cannot be self-funded: Pave must send the base reserve plus the trustline reserve first.
    if (network.mainnet) throw new Error('Wallet is awaiting its XLM reserve funding before USDC can be enabled.');
    const funded = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
    if (!funded.ok) throw new Error(`Testnet funding failed (${funded.status}).`);
    account = await horizon.loadAccount(address);
  }

  const usdc = new Asset('USDC', usdcIssuer);
  const hasTrustline = account.balances.some(
    (b) => 'asset_code' in b && b.asset_code === 'USDC' && 'asset_issuer' in b && b.asset_issuer === usdcIssuer,
  );
  if (hasTrustline) return;

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: network.passphrase })
    .addOperation(Operation.changeTrust({ asset: usdc }))
    .setTimeout(120)
    .build();
  const signature = await signEd25519(config, address, tx.hash());
  tx.signatures.push(new xdr.DecoratedSignature({ hint: Keypair.fromPublicKey(address).signatureHint(), signature }));
  await horizon.submitTransaction(tx);
}

// Idempotent. A merchant keeps one permanent Stellar wallet: it is created once in
// Turnkey, then activated and given the USDC trustline. Repeated or concurrent calls
// resume from whatever step is incomplete and always return the stored wallet.
export async function ensureMerchantStellarWallet(
  rpc: Rpc,
  merchantId: string,
  network: StellarNetworkConfig,
): Promise<MerchantWalletInfo> {
  let wallet = await getMerchantStellarWallet(rpc, merchantId);
  if (wallet?.status === 'ready') return wallet;

  if (!wallet) {
    const created = await createStellarWallet(turnkeyConfigFromEnv(), `pave-${merchantId}`.slice(0, 64));
    const [row] = rows(await callRpc(rpc, 'upsert_merchant_wallet', {
      p_merchant_id: merchantId,
      p_family: 'stellar',
      p_address: created.stellarAddress,
      p_turnkey_wallet_id: created.walletId,
    }));
    wallet = toInfo(row);
  }

  try {
    await activateAndTrust(wallet.address, network);
    await callRpc(rpc, 'mark_merchant_wallet_ready', { p_wallet_id: wallet.walletId, p_trustline: true });
    return { ...wallet, status: 'ready', usdcTrustline: true };
  } catch (error) {
    const message = (error as Error).message.slice(0, 300);
    await callRpc(rpc, 'mark_merchant_wallet_ready', { p_wallet_id: wallet.walletId, p_trustline: false, p_error: message });
    throw error;
  }
}

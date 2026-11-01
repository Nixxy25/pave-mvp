// Minimal Turnkey API client using Node crypto only. Server-side use only: it
// holds the API private key and must never be imported by client components.
import { createECDH, createSign, createPrivateKey } from 'node:crypto';

const BASE_URL = 'https://api.turnkey.com';

export interface TurnkeyConfig {
  organizationId: string;
  publicKey: string;
  privateKey: string;
}

export function turnkeyConfigFromEnv(env: NodeJS.ProcessEnv = process.env): TurnkeyConfig {
  const organizationId = env.TURNKEY_ORGANIZATION_ID;
  const publicKey = env.TURNKEY_PUBLIC_KEY;
  const privateKey = env.TURNKEY_PRIVATE_KEY;
  if (!organizationId || !publicKey || !privateKey) {
    throw new Error('TURNKEY_ORGANIZATION_ID, TURNKEY_PUBLIC_KEY and TURNKEY_PRIVATE_KEY are required.');
  }
  return { organizationId, publicKey, privateKey };
}

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function stamp(config: TurnkeyConfig, body: string): string {
  const ecdh = createECDH('prime256v1');
  ecdh.setPrivateKey(Buffer.from(config.privateKey, 'hex'));
  const uncompressed = ecdh.getPublicKey();
  const key = createPrivateKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      d: base64Url(Buffer.from(config.privateKey, 'hex')),
      x: base64Url(uncompressed.subarray(1, 33)),
      y: base64Url(uncompressed.subarray(33, 65)),
    },
    format: 'jwk',
  });
  const signature = createSign('SHA256').update(body).sign({ key, dsaEncoding: 'der' }).toString('hex');
  return base64Url(JSON.stringify({
    publicKey: config.publicKey,
    scheme: 'SIGNATURE_SCHEME_TK_API_P256',
    signature,
  }));
}

async function post<T>(config: TurnkeyConfig, path: string, payload: unknown): Promise<T> {
  const body = JSON.stringify(payload);
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Stamp': stamp(config, body) },
    body,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Turnkey ${path} failed (${response.status}): ${text.slice(0, 300)}`);
  return JSON.parse(text) as T;
}

interface Activity {
  activity: {
    id: string;
    status: string;
    result?: {
      createWalletResult?: { walletId?: string; addresses?: string[] };
      signRawPayloadResult?: { r?: string; s?: string };
    };
    failure?: { message?: string };
  };
}

async function submit(config: TurnkeyConfig, path: string, type: string, parameters: unknown): Promise<Activity['activity']> {
  const { activity } = await post<Activity>(config, path, {
    type,
    timestampMs: String(Date.now()),
    organizationId: config.organizationId,
    parameters,
  });
  if (activity.status !== 'ACTIVITY_STATUS_COMPLETED') {
    throw new Error(`Turnkey activity ${activity.status}: ${activity.failure?.message ?? 'not completed'}`);
  }
  return activity;
}

export interface TurnkeyWallet {
  walletId: string;
  stellarAddress: string;
}

// Creates one wallet with a Stellar (Ed25519, SLIP-0010 path 44'/148') account.
export async function createStellarWallet(config: TurnkeyConfig, walletName: string): Promise<TurnkeyWallet> {
  const activity = await submit(config, '/public/v1/submit/create_wallet', 'ACTIVITY_TYPE_CREATE_WALLET', {
    walletName,
    accounts: [{
      curve: 'CURVE_ED25519',
      pathFormat: 'PATH_FORMAT_BIP32',
      path: "m/44'/148'/0'",
      addressFormat: 'ADDRESS_FORMAT_XLM',
    }],
  });
  const result = activity.result?.createWalletResult;
  if (!result?.walletId || !result.addresses?.[0]) throw new Error('Turnkey did not return a Stellar address.');
  return { walletId: result.walletId, stellarAddress: result.addresses[0] };
}

// Signs raw bytes (for Stellar: the 32-byte transaction hash) with Ed25519.
export async function signEd25519(config: TurnkeyConfig, signWith: string, payload: Buffer): Promise<Buffer> {
  const activity = await submit(config, '/public/v1/submit/sign_raw_payload', 'ACTIVITY_TYPE_SIGN_RAW_PAYLOAD_V2', {
    signWith,
    payload: payload.toString('hex'),
    encoding: 'PAYLOAD_ENCODING_HEXADECIMAL',
    hashFunction: 'HASH_FUNCTION_NOT_APPLICABLE',
  });
  const result = activity.result?.signRawPayloadResult;
  if (!result?.r || !result.s) throw new Error('Turnkey did not return a signature.');
  return Buffer.from(result.r + result.s, 'hex');
}

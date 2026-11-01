import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveStellarNetwork } from './network.ts';

test('defaults to testnet', () => {
  const config = resolveStellarNetwork({});
  assert.equal(config.id, 'stellar-testnet');
  assert.equal(config.mainnet, false);
  assert.match(config.horizonUrl, /testnet/);
});

test('mainnet uses Circle USDC and the public Horizon', () => {
  const config = resolveStellarNetwork({ PAVE_STELLAR_NETWORK: 'mainnet' });
  assert.equal(config.id, 'stellar-mainnet');
  assert.equal(config.usdcIssuer, 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
  assert.equal(config.horizonUrl, 'https://horizon.stellar.org');
});

test('refuses a mainnet network with a staging environment or testnet Horizon', () => {
  assert.throws(() => resolveStellarNetwork({
    PAVE_STELLAR_NETWORK: 'mainnet', STELLAR_HORIZON_URL: 'https://horizon-testnet.stellar.org',
  }));
  assert.throws(() => resolveStellarNetwork({
    PAVE_STELLAR_NETWORK: 'testnet', STELLAR_HORIZON_URL: 'https://horizon.stellar.org',
  }));
});

test('rejects an invalid issuer or network name', () => {
  assert.throws(() => resolveStellarNetwork({ PAVE_STELLAR_NETWORK: 'mainnet', STELLAR_USDC_ISSUER: 'nope' }));
  assert.throws(() => resolveStellarNetwork({ PAVE_STELLAR_NETWORK: 'devnet' }));
});

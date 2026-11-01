import { NextRequest, NextResponse } from 'next/server';
import { gunzipSync } from 'node:zlib';
import { supabase } from '@/lib/supabase/server';
import { resolveStellarNetwork } from '@/features/payments/stellar/network';
import { createHorizonClient, listLedgerPaymentHashes } from '@/features/payments/stellar/horizon';
import { createPaymentEngineStore, callRpc, listWatchedWallets, type Rpc } from '@/features/payments/stellar/store';
import { processTransactions } from '@/features/payments/stellar/processor';
import {
  MAX_BODY_BYTES,
  extractLedgerSequences,
  extractTransactionHashes,
  payloadHash,
  verifyQuickNodeSignature,
} from '@/features/payments/webhooks/quicknode';

export const maxDuration = 60;

const rpc: Rpc = async (fn, args) => {
  const { data, error } = await supabase.rpc(fn, args);
  return { data, error: error ? { message: error.message, code: error.code } : null };
};

// QuickNode delivery only triggers verification; it is never trusted as proof.
// Order: authenticate, replay-check, then re-verify each named transaction on Horizon.
export async function POST(request: NextRequest) {
  const secret = process.env.QUICKNODE_STELLAR_WEBHOOK;
  let network;
  try {
    network = resolveStellarNetwork();
  } catch (error) {
    console.error('[quicknode-webhook] Misconfigured network:', (error as Error).message);
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 });
  }
  if (!secret) {
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 });
  }

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });

  const raw = Buffer.from(await request.arrayBuffer());
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });

  let body: string;
  try {
    // The signature covers the decompressed JSON.
    body = request.headers.get('content-encoding') === 'gzip' && raw[0] === 0x1f
      ? gunzipSync(raw, { maxOutputLength: MAX_BODY_BYTES }).toString('utf8')
      : raw.toString('utf8');
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const nonce = request.headers.get('x-qn-nonce');
  const verdict = verifyQuickNodeSignature(secret, body, {
    nonce,
    timestamp: request.headers.get('x-qn-timestamp'),
    signature: request.headers.get('x-qn-signature'),
  });
  // QuickNode's "Test connection" sends no signature; acknowledge it without processing anything.
  if (verdict === 'missing') {
    return NextResponse.json({ ok: true, processed: false });
  }
  if (verdict !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  try {
    const fresh = await callRpc(rpc, 'record_webhook_event', {
      p_provider: 'quicknode',
      p_network: network.id,
      p_delivery_id: nonce,
      p_payload_hash: payloadHash(body),
    });
    if (fresh !== true) return NextResponse.json({ ok: true, replay: true });

    const wallets = await listWatchedWallets(rpc);
    const sequences = extractLedgerSequences(payload);
    let hashes: string[];
    if (sequences.length) {
      const addresses = new Set(wallets.map((w) => w.address).filter((address) => body.includes(address)));
      hashes = addresses.size
        ? [...new Set((await Promise.all(
          sequences.map((sequence) => listLedgerPaymentHashes(network.horizonUrl, sequence, addresses)),
        )).flat())]
        : [];
    } else {
      hashes = extractTransactionHashes(payload);
    }
    const summary = hashes.length && wallets.length
      ? await processTransactions(
        {
          horizon: createHorizonClient(network.horizonUrl),
          store: createPaymentEngineStore(rpc, network.id),
          wallets,
        },
        hashes,
      )
      : { posted: 0, replayed: 0, unknown: 0, reconciled: {} };
    await callRpc(rpc, 'finish_webhook_event', { p_provider: 'quicknode', p_delivery_id: nonce, p_status: 'processed' });
    return NextResponse.json({ ok: true, posted: summary.posted, unknown: summary.unknown });
  } catch (error) {
    console.error('[quicknode-webhook] Processing failed:', (error as Error).message);
    await callRpc(rpc, 'finish_webhook_event', {
      p_provider: 'quicknode', p_delivery_id: nonce, p_status: 'failed', p_error: (error as Error).message.slice(0, 300),
    }).catch(() => undefined);
    // Non-2xx so QuickNode retries the delivery.
    return NextResponse.json({ error: 'Processing failed.' }, { status: 500 });
  }
}

import { API_ENDPOINTS } from '@/lib/constants';

export interface StellarClientPayment {
  sourceAddress: string;
  merchantAddress: string;
  xlmAmount: number;
}

export async function submitStellarPayment({
  sourceAddress,
  merchantAddress,
  xlmAmount,
}: StellarClientPayment): Promise<string> {
  const { TransactionBuilder, Asset, Networks, Operation, Memo, Horizon } =
    await import('@stellar/stellar-sdk');
  const server = new Horizon.Server(API_ENDPOINTS.STELLAR_HORIZON_TESTNET);
  const account = await server.loadAccount(sourceAddress);

  const transaction = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: merchantAddress,
        asset: Asset.native(),
        amount: xlmAmount.toFixed(7),
      }),
    )
    .addMemo(Memo.text('Pave checkout'))
    .setTimeout(180)
    .build();

  const { StellarWalletsKit } = await import('@creit.tech/stellar-wallets-kit/sdk');
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(transaction.toXDR(), {
    networkPassphrase: Networks.TESTNET,
    address: sourceAddress,
  });

  const signedTransaction = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
  const response = await server.submitTransaction(signedTransaction);
  return response.hash;
}

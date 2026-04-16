import {
  getCurrentUser as getCognitoUser,
  fetchUserAttributes,
  fetchAuthSession,
} from 'aws-amplify/auth';
import type { Merchant } from '@/types';

export async function getUserProfile(): Promise<Merchant> {
  const cognitoUser = await getCognitoUser();
  const userId = cognitoUser.userId;
  const isGoogleUser = cognitoUser.username?.startsWith('google_') || false;

  let email = '';
  let name = '';
  let businessName = '';

  if (isGoogleUser) {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;
    if (idToken?.payload) {
      email = (idToken.payload.email as string) || '';
      name = (idToken.payload.name as string) || '';
    }
    const attrs = await fetchUserAttributes();
    businessName = attrs.nickname || '';
  } else {
    const attributes = await fetchUserAttributes();
    email = attributes.email || '';
    name = attributes.name || '';
    businessName = attributes.nickname || '';
  }

  let apiKeys = JSON.parse(localStorage.getItem(`pave_api_keys_${userId}`) || 'null');
  if (!apiKeys) {
    apiKeys = {
      apiKey: `pk_test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      secretKey: `sk_test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      stellarWalletAddress: `G${Math.random().toString(36).substring(2, 15).toUpperCase()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
    };
    localStorage.setItem(`pave_api_keys_${userId}`, JSON.stringify(apiKeys));
  }

  return {
    id: userId,
    name,
    email,
    businessName,
    createdAt: new Date().toISOString(),
    plan: 'Free',
    apiKey: apiKeys.apiKey,
    secretKey: apiKeys.secretKey,
    stellarWallet: apiKeys.stellarWalletAddress,
    stellarWalletAddress: apiKeys.stellarWalletAddress,
    preferences: {
      emailNotifications: true,
      autoWithdrawal: false,
      stellarExplorerLinks: true,
      twoFactorAuth: false,
    },
  } as Merchant;
}

import { createRemoteJWKSet, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import { API_ENDPOINTS, PRIVY_APP_ID } from '@/lib/constants';

// Privy signs access tokens with keys published at this JWKS endpoint
const jwks = createRemoteJWKSet(
  new URL(`${API_ENDPOINTS.PRIVY_AUTH_BASE}/apps/${PRIVY_APP_ID}/jwks.json`),
);

export interface PrivyIdentity {
  userId: string;
  expiresAt?: number;
}

export async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const identity = await verifyPrivyAccessToken(authHeader.slice(7));
  return identity?.userId ?? null;
}

export async function verifyPrivyAccessToken(token: string): Promise<PrivyIdentity | null> {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: 'privy.io',
      audience: PRIVY_APP_ID,
    });
    if (typeof payload.sub !== 'string') return null;
    return {
      userId: payload.sub,
      ...(typeof payload.exp === 'number' ? { expiresAt: payload.exp } : {}),
    };
  } catch {
    return null;
  }
}

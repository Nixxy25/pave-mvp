import { createRemoteJWKSet, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import { API_ENDPOINTS, PRIVY_APP_ID } from './constants';

// Privy signs access tokens with keys published at this JWKS endpoint
const jwks = createRemoteJWKSet(
  new URL(`${API_ENDPOINTS.PRIVY_AUTH_BASE}/apps/${PRIVY_APP_ID}/jwks.json`),
);


export async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: 'privy.io',
      audience: PRIVY_APP_ID,
    });
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

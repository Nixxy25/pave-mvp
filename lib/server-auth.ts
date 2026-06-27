import { createRemoteJWKSet, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

// Privy signs access tokens with keys published at this JWKS endpoint
const jwks = createRemoteJWKSet(
  new URL(`https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`),
);

/**
 * Verifies the Privy JWT in the Authorization header and returns the userId (DID).
 * Returns null if the token is missing or invalid.
 */
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

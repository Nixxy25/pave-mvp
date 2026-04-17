import { createRemoteJWKSet, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const region = process.env.NEXT_PUBLIC_AWS_REGION!;
const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!;

const JWKS_URL = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
const ISSUER = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

const jwks = createRemoteJWKSet(new URL(JWKS_URL));

/**
 * Verifies the Cognito JWT in the Authorization header and returns the userId (sub).
 * Returns null if the token is missing or invalid.
 */
export async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: ISSUER });
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

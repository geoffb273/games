import jwt from 'jsonwebtoken';

import { JWT_SECRET } from '@/constants';
import { UnauthorizedError } from '@/schema/errors';

export type TokenPayload = {
  userId: string;
};

/**
 * Create a JWT token for the given payload.
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '90d' });
}

/**
 * Verify a JWT token and return the payload.
 *
 * @throws {UnauthorizedError} - If the token is invalid or expired.
 */
export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    throw new UnauthorizedError('Toekn verification failed');
  }
}
